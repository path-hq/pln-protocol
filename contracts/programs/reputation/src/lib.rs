use anchor_lang::prelude::*;

// Solana Playground Program ID (will be updated after deploy)
declare_id!("7UkU7PFm4eNYoTT5pe3kCFYvVfahKe8oZH6W2pkaxCZY");

/// Credit limit tiers (in USDC, 6 decimals)
/// Tier 1: $50 (new agents)
/// Tier 2: $500 (1-4 successful repayments)
/// Tier 3: $5,000 (5-19 successful repayments)
/// Tier 4: $25,000 (20-49 successful repayments)
/// Tier 5: $75,000 (50+ successful repayments)
pub const TIER_1_LIMIT: u64 = 50_000_000;       // $50
pub const TIER_2_LIMIT: u64 = 500_000_000;      // $500
pub const TIER_3_LIMIT: u64 = 5_000_000_000;    // $5,000
pub const TIER_4_LIMIT: u64 = 25_000_000_000;   // $25,000
pub const TIER_5_LIMIT: u64 = 75_000_000_000;   // $75,000

/// Repayment thresholds for each tier
pub const TIER_2_THRESHOLD: u32 = 1;
pub const TIER_3_THRESHOLD: u32 = 5;
pub const TIER_4_THRESHOLD: u32 = 20;
pub const TIER_5_THRESHOLD: u32 = 50;

/// Default penalty: -$10,000 per default (in credit limit reduction)
pub const DEFAULT_PENALTY: u64 = 10_000_000_000; // $10,000

#[program]
pub mod reputation {
    use super::*;

    /// Create profile for new agent
    pub fn register_agent(ctx: Context<RegisterAgent>) -> Result<()> {
        let profile = &mut ctx.accounts.profile;
        let clock = Clock::get()?;
        
        profile.wallet = ctx.accounts.wallet.key();
        profile.loans_taken = 0;
        profile.loans_repaid = 0;
        profile.loans_defaulted = 0;
        profile.total_borrowed = 0;
        profile.total_repaid = 0;
        profile.total_lent = 0;
        profile.score = 500; // Base score
        profile.successful_repayments = 0;
        profile.defaults = 0;
        profile.credit_tier = 1; // Start at Tier 1
        profile.max_borrow_limit = TIER_1_LIMIT; // $50 initial limit
        profile.created_at = clock.unix_timestamp;
        profile.updated_at = clock.unix_timestamp;
        profile.bump = ctx.bumps.profile;
        
        msg!("Agent registered: {} with initial credit limit: ${}", 
             profile.wallet, 
             profile.max_borrow_limit / 1_000_000);
        Ok(())
    }

    /// Record successful repayment - called by credit_market program
    /// This increases the agent's credit tier and max borrow limit
    pub fn record_repayment(
        ctx: Context<RecordActivity>,
        amount: u64,
    ) -> Result<()> {
        let profile = &mut ctx.accounts.profile;
        let clock = Clock::get()?;
        
        profile.loans_repaid += 1;
        profile.total_repaid += amount;
        profile.successful_repayments += 1;
        profile.updated_at = clock.unix_timestamp;
        
        // Recalculate credit tier and max borrow limit
        let (new_tier, new_limit) = calculate_credit_tier(
            profile.successful_repayments,
            profile.defaults
        );
        profile.credit_tier = new_tier;
        profile.max_borrow_limit = new_limit;
        
        // Recalculate reputation score
        profile.score = calculate_score(profile);
        
        msg!("Repayment recorded: {} USDC. Successful repayments: {}. New tier: {}. Max borrow: ${}", 
             amount / 1_000_000,
             profile.successful_repayments,
             profile.credit_tier,
             profile.max_borrow_limit / 1_000_000);
        Ok(())
    }

    /// Record default - called by credit_market program
    /// This applies a penalty to the agent's credit limit
    pub fn record_default(
        ctx: Context<RecordActivity>,
        amount: u64,
    ) -> Result<()> {
        let profile = &mut ctx.accounts.profile;
        let clock = Clock::get()?;
        
        profile.loans_defaulted += 1;
        profile.defaults += 1;
        profile.updated_at = clock.unix_timestamp;
        
        // Recalculate credit tier and max borrow limit (with penalty)
        let (new_tier, new_limit) = calculate_credit_tier(
            profile.successful_repayments,
            profile.defaults
        );
        profile.credit_tier = new_tier;
        profile.max_borrow_limit = new_limit;
        
        // Recalculate reputation score
        profile.score = calculate_score(profile);
        
        msg!("Default recorded: {} USDC. Defaults: {}. New tier: {}. Max borrow: ${}", 
             amount / 1_000_000,
             profile.defaults,
             profile.credit_tier,
             profile.max_borrow_limit / 1_000_000);
        Ok(())
    }

    /// Record lending activity - called by credit_market program
    pub fn record_lending(
        ctx: Context<RecordActivity>,
        amount: u64,
    ) -> Result<()> {
        let profile = &mut ctx.accounts.profile;
        let clock = Clock::get()?;
        
        profile.total_lent += amount;
        profile.updated_at = clock.unix_timestamp;
        
        msg!("Lending recorded: {} USDC. Total lent: ${}", 
             amount / 1_000_000, 
             profile.total_lent / 1_000_000);
        Ok(())
    }

    /// Record loan taken - called by credit_market program
    pub fn record_loan_taken(
        ctx: Context<RecordActivity>,
        amount: u64,
    ) -> Result<()> {
        let profile = &mut ctx.accounts.profile;
        let clock = Clock::get()?;
        
        profile.loans_taken += 1;
        profile.total_borrowed += amount;
        profile.updated_at = clock.unix_timestamp;
        
        msg!("Loan taken recorded: {} USDC. Total borrowed: ${}", 
             amount / 1_000_000, 
             profile.total_borrowed / 1_000_000);
        Ok(())
    }

    /// Get current score (view function)
    pub fn get_score(ctx: Context<GetScore>) -> Result<u16> {
        let profile = &ctx.accounts.profile;
        Ok(profile.score)
    }

    /// Get max borrow limit for an agent (view function)
    pub fn get_max_borrow(ctx: Context<GetScore>) -> Result<u64> {
        let profile = &ctx.accounts.profile;
        Ok(profile.max_borrow_limit)
    }

    /// Get credit tier info (view function)
    pub fn get_credit_tier_info(ctx: Context<GetScore>) -> Result<CreditTierInfo> {
        let profile = &ctx.accounts.profile;
        
        let (next_tier, repayments_needed) = get_next_tier_requirements(
            profile.credit_tier,
            profile.successful_repayments
        );
        
        Ok(CreditTierInfo {
            current_tier: profile.credit_tier,
            max_borrow_limit: profile.max_borrow_limit,
            successful_repayments: profile.successful_repayments,
            defaults: profile.defaults,
            next_tier,
            repayments_to_next_tier: repayments_needed,
        })
    }
}

/// Calculate credit tier and max borrow limit based on successful repayments
/// and defaults. Each default reduces the limit by $10,000.
pub fn calculate_credit_tier(successful_repayments: u32, defaults: u32) -> (u8, u64) {
    // Determine base tier from successful repayments
    let (tier, base_limit) = if successful_repayments >= TIER_5_THRESHOLD {
        (5, TIER_5_LIMIT)
    } else if successful_repayments >= TIER_4_THRESHOLD {
        (4, TIER_4_LIMIT)
    } else if successful_repayments >= TIER_3_THRESHOLD {
        (3, TIER_3_LIMIT)
    } else if successful_repayments >= TIER_2_THRESHOLD {
        (2, TIER_2_LIMIT)
    } else {
        (1, TIER_1_LIMIT)
    };
    
    // Apply default penalty: -$10,000 per default
    let penalty = (defaults as u64) * DEFAULT_PENALTY;
    let adjusted_limit = base_limit.saturating_sub(penalty);
    
    // Ensure minimum of $50 (Tier 1 limit)
    let final_limit = adjusted_limit.max(TIER_1_LIMIT);
    
    // Recalculate effective tier based on adjusted limit
    let effective_tier = if final_limit >= TIER_5_LIMIT {
        5
    } else if final_limit >= TIER_4_LIMIT {
        4
    } else if final_limit >= TIER_3_LIMIT {
        3
    } else if final_limit >= TIER_2_LIMIT {
        2
    } else {
        1
    };
    
    (effective_tier, final_limit)
}

/// Calculate the max borrow amount for a given number of successful repayments
/// This is a public helper function that can be used by other programs
pub fn calculate_max_borrow(successful_repayments: u32, defaults: u32) -> u64 {
    let (_, limit) = calculate_credit_tier(successful_repayments, defaults);
    limit
}

/// Get requirements for the next tier
fn get_next_tier_requirements(current_tier: u8, successful_repayments: u32) -> (u8, u32) {
    match current_tier {
        1 => (2, TIER_2_THRESHOLD.saturating_sub(successful_repayments)),
        2 => (3, TIER_3_THRESHOLD.saturating_sub(successful_repayments)),
        3 => (4, TIER_4_THRESHOLD.saturating_sub(successful_repayments)),
        4 => (5, TIER_5_THRESHOLD.saturating_sub(successful_repayments)),
        5 => (5, 0), // Already at max tier
        _ => (1, 0),
    }
}

/// Calculate reputation score based on activity
/// Base: 500
/// +20 per successful repayment
/// +1 per 1 USDC repaid  
/// +1 per 10 USDC lent
/// -100 per default
/// -5 per open loan
fn calculate_score(profile: &AgentProfile) -> u16 {
    let mut score: i32 = 500; // Base score
    
    // Positive factors
    score += (profile.successful_repayments as i32) * 20; // +20 per successful repayment
    score += (profile.total_repaid / 1_000_000) as i32; // +1 per USDC repaid
    score += (profile.total_lent / 10_000_000) as i32; // +1 per 10 USDC lent
    
    // Negative factors
    score -= (profile.defaults as i32) * 100; // -100 per default
    score -= (profile.loans_taken.saturating_sub(profile.loans_repaid) as i32) * 5; // -5 per open loan
    
    // Clamp to 0-1000
    score.max(0).min(1000) as u16
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct CreditTierInfo {
    pub current_tier: u8,
    pub max_borrow_limit: u64,
    pub successful_repayments: u32,
    pub defaults: u32,
    pub next_tier: u8,
    pub repayments_to_next_tier: u32,
}

#[derive(Accounts)]
pub struct RegisterAgent<'info> {
    #[account(mut)]
    pub wallet: Signer<'info>,
    
    #[account(
        init,
        payer = wallet,
        space = 8 + AgentProfile::SIZE,
        seeds = [b"profile", wallet.key().as_ref()],
        bump
    )]
    pub profile: Account<'info, AgentProfile>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RecordActivity<'info> {
    #[account(mut)]
    pub profile: Account<'info, AgentProfile>,
    
    /// CHECK: This is the credit_market program that can update reputation
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct GetScore<'info> {
    pub profile: Account<'info, AgentProfile>,
}

#[account]
pub struct AgentProfile {
    pub wallet: Pubkey,
    pub loans_taken: u32,
    pub loans_repaid: u32,
    pub loans_defaulted: u32,
    pub total_borrowed: u64,
    pub total_repaid: u64,
    pub total_lent: u64,
    pub score: u16,
    // New fields for graduated credit limits
    pub successful_repayments: u32,
    pub defaults: u32,
    pub credit_tier: u8,
    pub max_borrow_limit: u64,
    pub created_at: i64,
    pub updated_at: i64,
    pub bump: u8,
}

impl AgentProfile {
    pub const SIZE: usize = 32 + // wallet: Pubkey
        4 +  // loans_taken: u32
        4 +  // loans_repaid: u32
        4 +  // loans_defaulted: u32
        8 +  // total_borrowed: u64
        8 +  // total_repaid: u64
        8 +  // total_lent: u64
        2 +  // score: u16
        4 +  // successful_repayments: u32
        4 +  // defaults: u32
        1 +  // credit_tier: u8
        8 +  // max_borrow_limit: u64
        8 +  // created_at: i64
        8 +  // updated_at: i64
        1;   // bump: u8
}

#[error_code]
pub enum ErrorCode {
    #[msg("Profile not found")]
    ProfileNotFound,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Borrow amount exceeds credit limit")]
    ExceedsCreditLimit,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tier_calculation() {
        // New agent
        assert_eq!(calculate_credit_tier(0, 0), (1, TIER_1_LIMIT));
        
        // After 1 repayment
        assert_eq!(calculate_credit_tier(1, 0), (2, TIER_2_LIMIT));
        
        // After 5 repayments
        assert_eq!(calculate_credit_tier(5, 0), (3, TIER_3_LIMIT));
        
        // After 20 repayments
        assert_eq!(calculate_credit_tier(20, 0), (4, TIER_4_LIMIT));
        
        // After 50 repayments
        assert_eq!(calculate_credit_tier(50, 0), (5, TIER_5_LIMIT));
    }

    #[test]
    fn test_default_penalty() {
        // Tier 5 with 1 default: $75K - $10K = $65K
        let (tier, limit) = calculate_credit_tier(50, 1);
        assert_eq!(limit, 65_000_000_000);
        assert_eq!(tier, 4); // Drops to tier 4 limit range
        
        // Tier 5 with 7 defaults: $75K - $70K = $5K (Tier 3)
        let (tier, limit) = calculate_credit_tier(50, 7);
        assert_eq!(limit, 5_000_000_000);
        assert_eq!(tier, 3);
        
        // Extreme case: more defaults than possible penalty
        // $75K - $80K = min($50)
        let (tier, limit) = calculate_credit_tier(50, 8);
        assert_eq!(limit, TIER_1_LIMIT); // Capped at $50
        assert_eq!(tier, 1);
    }

    #[test]
    fn test_max_borrow_helper() {
        assert_eq!(calculate_max_borrow(0, 0), TIER_1_LIMIT);
        assert_eq!(calculate_max_borrow(10, 0), TIER_3_LIMIT);
        assert_eq!(calculate_max_borrow(50, 0), TIER_5_LIMIT);
        assert_eq!(calculate_max_borrow(50, 2), 55_000_000_000); // $75K - $20K
    }
}
