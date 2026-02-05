use anchor_lang::prelude::*;

// Solana Playground Program ID (will be updated after deploy)
declare_id!("11111111111111111111111111111111");

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
        profile.created_at = clock.unix_timestamp;
        profile.updated_at = clock.unix_timestamp;
        profile.bump = ctx.bumps.profile;
        
        msg!("Agent registered: {}", profile.wallet);
        Ok(())
    }

    /// Record successful repayment - called by credit_market program
    pub fn record_repayment(
        ctx: Context<RecordActivity>,
        amount: u64,
    ) -> Result<()> {
        let profile = &mut ctx.accounts.profile;
        let clock = Clock::get()?;
        
        profile.loans_repaid += 1;
        profile.total_repaid += amount;
        profile.updated_at = clock.unix_timestamp;
        
        // Recalculate score
        profile.score = calculate_score(profile);
        
        msg!("Repayment recorded: {}. New score: {}", amount, profile.score);
        Ok(())
    }

    /// Record default - called by credit_market program
    pub fn record_default(
        ctx: Context<RecordActivity>,
        amount: u64,
    ) -> Result<()> {
        let profile = &mut ctx.accounts.profile;
        let clock = Clock::get()?;
        
        profile.loans_defaulted += 1;
        profile.updated_at = clock.unix_timestamp;
        
        // Recalculate score
        profile.score = calculate_score(profile);
        
        msg!("Default recorded: {}. New score: {}", amount, profile.score);
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
        
        msg!("Lending recorded: {}. Total lent: {}", amount, profile.total_lent);
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
        
        msg!("Loan taken recorded: {}. Total borrowed: {}", amount, profile.total_borrowed);
        Ok(())
    }

    /// Get current score (view function)
    pub fn get_score(ctx: Context<GetScore>) -> Result<u16> {
        let profile = &ctx.accounts.profile;
        Ok(profile.score)
    }
}

/// Calculate reputation score based on activity
/// Base: 500
/// +20 per repayment
/// +1 per 1 USDC repaid  
/// +1 per 10 USDC lent
/// -100 per default
/// -5 per open loan
fn calculate_score(profile: &AgentProfile) -> u16 {
    let mut score: i32 = 500; // Base score
    
    // Positive factors
    score += (profile.loans_repaid as i32) * 20; // +20 per repayment
    score += (profile.total_repaid / 1_000_000) as i32; // +1 per USDC repaid
    score += (profile.total_lent / 10_000_000) as i32; // +1 per 10 USDC lent
    
    // Negative factors
    score -= (profile.loans_defaulted as i32) * 100; // -100 per default
    score -= (profile.loans_taken.saturating_sub(profile.loans_repaid) as i32) * 5; // -5 per open loan
    
    // Clamp to 0-1000
    score.max(0).min(1000) as u16
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
}
