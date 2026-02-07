use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

// Solana Playground Program ID
declare_id!("11111111111111111111111111111111");

// === CONSTANTS ===
/// Max 5% of pool in a single loan
pub const MAX_SINGLE_LOAN_PCT: u16 = 500;
/// Max 10% of pool exposed to a single borrower
pub const MAX_SINGLE_BORROWER_PCT: u16 = 1000;
/// 1% of interest goes to insurance pool
pub const INSURANCE_FEE_BPS: u16 = 100;
/// Max 10% of insurance pool claimable per default
pub const MAX_INSURANCE_CLAIM_PCT: u16 = 1000;
/// Basis points divisor
pub const BPS_DIVISOR: u64 = 10_000;

/// LIQUIDITY ROUTER
/// Auto-routes lender funds between Kamino (passive) and P2P loans (active)
/// Now with diversification caps and insurance pool
#[program]
pub mod liquidity_router {
    use super::*;

    /// Initialize router config
    pub fn initialize_router(
        ctx: Context<InitializeRouter>,
        kamino_program: Pubkey,
        kamino_pool: Pubkey,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.admin = ctx.accounts.admin.key();
        config.kamino_program = kamino_program;
        config.kamino_pool = kamino_pool;
        config.kamino_rate_bps = 600; // 6% APY default
        config.fee_bps = 50; // 0.5% protocol fee
        config.bump = ctx.bumps.config;
        
        // Initialize liquidity pool
        let pool = &mut ctx.accounts.liquidity_pool;
        pool.total_deposits = 0;
        pool.total_loaned = 0;
        pool.total_in_kamino = 0;
        pool.insurance_pool_balance = 0;
        pool.bump = ctx.bumps.liquidity_pool;
        
        msg!("Router initialized with Kamino @ {} bps", config.kamino_rate_bps);
        msg!("Diversification: max {}% per loan, {}% per borrower", 
            MAX_SINGLE_LOAN_PCT / 100, MAX_SINGLE_BORROWER_PCT / 100);
        Ok(())
    }

    /// Lender deposits USDC - router decides where it goes
    pub fn deposit(
        ctx: Context<Deposit>,
        amount: u64,
    ) -> Result<()> {
        // Mainnet safety: Max $100 per deposit (6 decimals = 100_000_000)
        require!(
            amount <= 100_000_000,
            ErrorCode::ExceedsMaxDeposit
        );
        
        let position = &mut ctx.accounts.position;
        let pool = &mut ctx.accounts.liquidity_pool;
        let clock = Clock::get()?;
        
        // Initialize position if new
        if position.wallet == Pubkey::default() {
            position.wallet = ctx.accounts.lender.key();
            position.total_deposited = 0;
            position.in_kamino = 0;
            position.in_p2p = 0;
            position.min_p2p_rate_bps = 700; // Min 7% to shift from Kamino
            position.kamino_buffer_bps = 100; // Need 1% over Kamino
            position.auto_route = true;
            position.created_at = clock.unix_timestamp;
            position.bump = ctx.bumps.position;
            
            msg!("New lender position created");
        }
        
        // Check for pending borrow requests
        // For MVP: simple logic - if no borrowers, go to Kamino
        // In production: check on-chain borrow request queue
        let should_go_to_p2p = false; // Placeholder - would check borrow requests
        
        if should_go_to_p2p && position.auto_route {
            // Route to P2P
            position.in_p2p += amount;
            pool.total_loaned += amount;
            msg!("Routed {} USDC to P2P loan", amount);
        } else {
            // Route to Kamino for passive yield
            position.in_kamino += amount;
            pool.total_in_kamino += amount;
            
            // CPI to Kamino deposit (simplified for MVP)
            // In production: actual Kamino CPI call
            msg!("Routed {} USDC to Kamino @ {} bps", amount, ctx.accounts.config.kamino_rate_bps);
        }
        
        position.total_deposited += amount;
        pool.total_deposits += amount;
        position.updated_at = clock.unix_timestamp;
        
        // Transfer USDC from lender to router vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.lender_usdc.to_account_info(),
            to: ctx.accounts.router_vault.to_account_info(),
            authority: ctx.accounts.lender.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
        token::transfer(cpi_ctx, amount)?;
        
        msg!("Deposit complete. Total: {} USDC, Pool: {} USDC", 
            position.total_deposited, pool.total_deposits);
        Ok(())
    }

    /// Route funds to a loan with diversification checks
    /// If loan exceeds caps, excess goes to Kamino
    pub fn route_to_loan(
        ctx: Context<RouteToLoan>,
        loan_amount: u64,
        borrower: Pubkey,
        rate_bps: u16,
    ) -> Result<()> {
        let position = &mut ctx.accounts.position;
        let pool = &mut ctx.accounts.liquidity_pool;
        let exposure = &mut ctx.accounts.borrower_exposure;
        let config = &ctx.accounts.config;
        
        require!(position.auto_route, ErrorCode::AutoRouteDisabled);
        
        // Check minimum rate requirement
        let min_acceptable_rate = config.kamino_rate_bps + position.kamino_buffer_bps;
        if rate_bps < min_acceptable_rate {
            msg!("Rate {} bps too low (min: {} bps). Keeping in Kamino.", 
                rate_bps, min_acceptable_rate);
            return Ok(());
        }
        
        // Calculate diversification limits
        let max_per_loan = pool.total_deposits
            .checked_mul(MAX_SINGLE_LOAN_PCT as u64)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(BPS_DIVISOR)
            .ok_or(ErrorCode::MathOverflow)?;
            
        let max_per_borrower = pool.total_deposits
            .checked_mul(MAX_SINGLE_BORROWER_PCT as u64)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(BPS_DIVISOR)
            .ok_or(ErrorCode::MathOverflow)?;
        
        // Initialize borrower exposure if new
        if exposure.borrower == Pubkey::default() {
            exposure.borrower = borrower;
            exposure.total_exposure = 0;
            exposure.bump = ctx.bumps.borrower_exposure;
        }
        
        // Check single loan cap (5% of pool)
        let loan_capped = loan_amount.min(max_per_loan);
        
        // Check borrower exposure cap (10% of pool)
        let remaining_borrower_cap = max_per_borrower.saturating_sub(exposure.total_exposure);
        let amount_to_loan = loan_capped.min(remaining_borrower_cap);
        
        // Excess goes to Kamino
        let excess_to_kamino = loan_amount.saturating_sub(amount_to_loan);
        
        if amount_to_loan > 0 {
            // Check available funds in Kamino
            let available = position.in_kamino;
            let to_route = amount_to_loan.min(available);
            
            if to_route > 0 {
                // Shift from Kamino to P2P
                position.in_kamino -= to_route;
                position.in_p2p += to_route;
                pool.total_in_kamino -= to_route;
                pool.total_loaned += to_route;
                exposure.total_exposure += to_route;
                
                msg!("Routed {} USDC to loan @ {} bps (borrower exposure: {} USDC)", 
                    to_route, rate_bps, exposure.total_exposure);
            }
        }
        
        if excess_to_kamino > 0 {
            msg!("Diversification cap: {} USDC excess remains in Kamino", excess_to_kamino);
            msg!("  - Max per loan (5%): {} USDC", max_per_loan);
            msg!("  - Max per borrower (10%): {} USDC", max_per_borrower);
        }
        
        Ok(())
    }

    /// Called when new borrow request comes in
    /// Shifts funds from Kamino to P2P if rate is attractive
    pub fn on_borrow_request(
        ctx: Context<OnBorrowRequest>,
        amount: u64,
        rate_bps: u16,
        borrower_reputation: u16,
    ) -> Result<()> {
        let position = &mut ctx.accounts.position;
        let config = &ctx.accounts.config;
        
        require!(position.auto_route, ErrorCode::AutoRouteDisabled);
        
        // Check if rate is attractive
        let min_acceptable_rate = config.kamino_rate_bps + position.kamino_buffer_bps;
        
        if rate_bps < min_acceptable_rate {
            msg!("Rate {} bps too low (min: {} bps). Keeping in Kamino.", 
                rate_bps, min_acceptable_rate);
            return Ok(());
        }
        
        // Check if borrower reputation meets criteria
        if borrower_reputation < position.min_p2p_rate_bps {
            msg!("Borrower reputation {} too low (min: {})", 
                borrower_reputation, position.min_p2p_rate_bps);
            return Ok(());
        }
        
        // Calculate how much to shift
        let available_in_kamino = position.in_kamino;
        let to_shift = amount.min(available_in_kamino);
        
        if to_shift == 0 {
            msg!("No funds in Kamino to shift");
            return Ok(());
        }
        
        // Shift from Kamino to P2P
        // In production: CPI to withdraw from Kamino
        position.in_kamino -= to_shift;
        position.in_p2p += to_shift;
        
        msg!("Auto-shifted {} USDC from Kamino to P2P @ {} bps", to_shift, rate_bps);
        Ok(())
    }

    /// Collect loan repayment with insurance fee split
    /// 99% of interest to lender, 1% to insurance pool
    pub fn collect_repayment(
        ctx: Context<CollectRepayment>,
        principal: u64,
        interest: u64,
        borrower: Pubkey,
    ) -> Result<()> {
        let position = &mut ctx.accounts.position;
        let pool = &mut ctx.accounts.liquidity_pool;
        let exposure = &mut ctx.accounts.borrower_exposure;
        
        // Calculate insurance fee (1% of interest)
        let insurance_fee = interest
            .checked_mul(INSURANCE_FEE_BPS as u64)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(BPS_DIVISOR)
            .ok_or(ErrorCode::MathOverflow)?;
        
        let lender_interest = interest.saturating_sub(insurance_fee);
        let total_to_lender = principal + lender_interest;
        
        // Update insurance pool
        pool.insurance_pool_balance += insurance_fee;
        
        // Update position
        position.in_p2p -= principal;
        
        // Update borrower exposure
        exposure.total_exposure = exposure.total_exposure.saturating_sub(principal);
        
        // Update pool totals
        pool.total_loaned -= principal;
        
        // Check for next P2P opportunity
        // For MVP: route back to Kamino
        let next_p2p_available = false;
        
        if next_p2p_available && position.auto_route {
            position.in_p2p += total_to_lender;
            pool.total_loaned += total_to_lender;
            msg!("Rolled {} USDC into next P2P loan", total_to_lender);
        } else {
            position.in_kamino += total_to_lender;
            pool.total_in_kamino += total_to_lender;
            msg!("Returned {} USDC to Kamino (principal + lender interest)", total_to_lender);
        }
        
        msg!("Repayment collected: principal={}, interest={} (lender: {}, insurance: {})",
            principal, interest, lender_interest, insurance_fee);
        msg!("Insurance pool balance: {} USDC", pool.insurance_pool_balance);
        
        Ok(())
    }

    /// Called when loan is repaid (legacy compatibility)
    pub fn on_loan_repaid(
        ctx: Context<OnLoanRepaid>,
        principal: u64,
        interest: u64,
    ) -> Result<()> {
        let position = &mut ctx.accounts.position;
        let total_returned = principal + interest;
        
        // Update position
        position.in_p2p -= principal;
        
        // Check for next P2P opportunity
        // For MVP: route back to Kamino
        let next_p2p_available = false;
        
        if next_p2p_available && position.auto_route {
            position.in_p2p += total_returned;
            msg!("Rolled {} USDC into next P2P loan", total_returned);
        } else {
            position.in_kamino += total_returned;
            msg!("Returned {} USDC to Kamino (principal + interest)", total_returned);
        }
        
        Ok(())
    }

    /// Claim from insurance pool on loan default
    /// Max 10% of insurance pool per claim
    pub fn claim_insurance(
        ctx: Context<ClaimInsurance>,
        default_amount: u64,
    ) -> Result<()> {
        let position = &mut ctx.accounts.position;
        let pool = &mut ctx.accounts.liquidity_pool;
        
        require!(position.wallet == ctx.accounts.lender.key(), ErrorCode::Unauthorized);
        
        // Calculate max claimable (10% of insurance pool)
        let max_claimable = pool.insurance_pool_balance
            .checked_mul(MAX_INSURANCE_CLAIM_PCT as u64)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(BPS_DIVISOR)
            .ok_or(ErrorCode::MathOverflow)?;
        
        // Claim the lesser of default amount or max claimable
        let claim_amount = default_amount.min(max_claimable);
        
        require!(claim_amount > 0, ErrorCode::InsufficientInsurance);
        require!(pool.insurance_pool_balance >= claim_amount, ErrorCode::InsufficientInsurance);
        
        // Deduct from insurance pool
        pool.insurance_pool_balance -= claim_amount;
        
        // Add to lender's Kamino balance (safest place)
        position.in_kamino += claim_amount;
        pool.total_in_kamino += claim_amount;
        
        // Reduce P2P balance for the defaulted amount
        let defaulted = position.in_p2p.min(default_amount);
        position.in_p2p -= defaulted;
        pool.total_loaned -= defaulted;
        
        msg!("Insurance claim: {} USDC (requested: {}, max: {})", 
            claim_amount, default_amount, max_claimable);
        msg!("Insurance pool remaining: {} USDC", pool.insurance_pool_balance);
        
        Ok(())
    }

    /// Lender withdraws funds
    /// Priority: Kamino first (liquid), then P2P if possible
    pub fn withdraw(
        ctx: Context<Withdraw>,
        amount: u64,
    ) -> Result<()> {
        let position = &mut ctx.accounts.position;
        let pool = &mut ctx.accounts.liquidity_pool;
        
        require!(position.wallet == ctx.accounts.lender.key(), ErrorCode::Unauthorized);
        
        // First withdraw from Kamino (liquid)
        let from_kamino = amount.min(position.in_kamino);
        if from_kamino > 0 {
            position.in_kamino -= from_kamino;
            pool.total_in_kamino -= from_kamino;
            // In production: CPI to withdraw from Kamino
            msg!("Withdrew {} USDC from Kamino", from_kamino);
        }
        
        // If need more, try P2P
        let remaining = amount - from_kamino;
        if remaining > 0 {
            let from_p2p = remaining.min(position.in_p2p);
            if from_p2p > 0 {
                position.in_p2p -= from_p2p;
                pool.total_loaned -= from_p2p;
                msg!("Withdrew {} USDC from P2P (may need loan exit)", from_p2p);
            }
            
            // If still need more, queue withdrawal
            if remaining > from_p2p {
                msg!("Queued {} USDC for withdrawal when loans repay", remaining - from_p2p);
                // In production: add to withdrawal queue
            }
        }
        
        position.total_deposited -= amount;
        pool.total_deposits -= amount;
        
        // Transfer USDC to lender
        let seeds = &[b"router_vault", &[ctx.bumps.router_vault]];
        let signer = &[&seeds[..]];
        
        let cpi_accounts = Transfer {
            from: ctx.accounts.router_vault.to_account_info(),
            to: ctx.accounts.lender_usdc.to_account_info(),
            authority: ctx.accounts.router_vault.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(), 
            cpi_accounts, 
            signer
        );
        token::transfer(cpi_ctx, amount)?;
        
        msg!("Withdrawal complete: {} USDC", amount);
        Ok(())
    }

    /// Update lender routing strategy
    pub fn update_strategy(
        ctx: Context<UpdateStrategy>,
        min_p2p_rate_bps: Option<u16>,
        kamino_buffer_bps: Option<u16>,
        auto_route: Option<bool>,
    ) -> Result<()> {
        let position = &mut ctx.accounts.position;
        require!(position.wallet == ctx.accounts.lender.key(), ErrorCode::Unauthorized);
        
        if let Some(rate) = min_p2p_rate_bps {
            position.min_p2p_rate_bps = rate;
        }
        if let Some(buffer) = kamino_buffer_bps {
            position.kamino_buffer_bps = buffer;
        }
        if let Some(auto) = auto_route {
            position.auto_route = auto;
        }
        
        msg!("Strategy updated: min_rate={}, buffer={}, auto={}",
            position.min_p2p_rate_bps,
            position.kamino_buffer_bps,
            position.auto_route);
        Ok(())
    }

    /// Admin: Update Kamino APY
    pub fn update_kamino_rate(
        ctx: Context<AdminUpdate>,
        new_rate_bps: u16,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        require!(config.admin == ctx.accounts.admin.key(), ErrorCode::Unauthorized);
        
        config.kamino_rate_bps = new_rate_bps;
        msg!("Kamino rate updated to {} bps", new_rate_bps);
        Ok(())
    }

    /// View pool statistics
    pub fn get_pool_stats(ctx: Context<GetPoolStats>) -> Result<()> {
        let pool = &ctx.accounts.liquidity_pool;
        
        msg!("=== Pool Statistics ===");
        msg!("Total deposits: {} USDC", pool.total_deposits);
        msg!("Total loaned: {} USDC", pool.total_loaned);
        msg!("Total in Kamino: {} USDC", pool.total_in_kamino);
        msg!("Insurance pool: {} USDC", pool.insurance_pool_balance);
        msg!("Utilization: {}%", 
            if pool.total_deposits > 0 {
                pool.total_loaned * 100 / pool.total_deposits
            } else { 0 });
        
        Ok(())
    }
}

// === ACCOUNT STRUCTS ===

#[derive(Accounts)]
pub struct InitializeRouter<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    
    #[account(
        init,
        payer = admin,
        space = 8 + RouterConfig::SIZE,
        seeds = [b"router_config"],
        bump
    )]
    pub config: Account<'info, RouterConfig>,
    
    #[account(
        init,
        payer = admin,
        space = 8 + LiquidityPool::SIZE,
        seeds = [b"liquidity_pool"],
        bump
    )]
    pub liquidity_pool: Account<'info, LiquidityPool>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub lender: Signer<'info>,
    
    #[account(
        init_if_needed,
        payer = lender,
        space = 8 + LenderPosition::SIZE,
        seeds = [b"position", lender.key().as_ref()],
        bump
    )]
    pub position: Account<'info, LenderPosition>,
    
    #[account(mut, seeds = [b"liquidity_pool"], bump)]
    pub liquidity_pool: Account<'info, LiquidityPool>,
    
    #[account(mut)]
    pub lender_usdc: Account<'info, TokenAccount>,
    
    #[account(
        init_if_needed,
        payer = lender,
        token::mint = usdc_mint,
        token::authority = router_vault,
        seeds = [b"router_vault"],
        bump
    )]
    pub router_vault: Account<'info, TokenAccount>,
    
    pub usdc_mint: Account<'info, token::Mint>,
    
    pub config: Account<'info, RouterConfig>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(loan_amount: u64, borrower: Pubkey)]
pub struct RouteToLoan<'info> {
    /// CHECK: Credit market or authorized caller
    pub authority: Signer<'info>,
    
    #[account(mut)]
    pub position: Account<'info, LenderPosition>,
    
    #[account(mut, seeds = [b"liquidity_pool"], bump)]
    pub liquidity_pool: Account<'info, LiquidityPool>,
    
    #[account(
        init_if_needed,
        payer = payer,
        space = 8 + BorrowerExposure::SIZE,
        seeds = [b"exposure", borrower.as_ref()],
        bump
    )]
    pub borrower_exposure: Account<'info, BorrowerExposure>,
    
    pub config: Account<'info, RouterConfig>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct OnBorrowRequest<'info> {
    /// CHECK: Credit market program that calls this
    pub authority: Signer<'info>,
    
    #[account(mut)]
    pub position: Account<'info, LenderPosition>,
    
    pub config: Account<'info, RouterConfig>,
}

#[derive(Accounts)]
#[instruction(principal: u64, interest: u64, borrower: Pubkey)]
pub struct CollectRepayment<'info> {
    /// CHECK: Credit market or authorized caller
    pub authority: Signer<'info>,
    
    #[account(mut)]
    pub position: Account<'info, LenderPosition>,
    
    #[account(mut, seeds = [b"liquidity_pool"], bump)]
    pub liquidity_pool: Account<'info, LiquidityPool>,
    
    #[account(
        mut,
        seeds = [b"exposure", borrower.as_ref()],
        bump
    )]
    pub borrower_exposure: Account<'info, BorrowerExposure>,
}

#[derive(Accounts)]
pub struct OnLoanRepaid<'info> {
    /// CHECK: Credit market program that calls this
    pub authority: Signer<'info>,
    
    #[account(mut)]
    pub position: Account<'info, LenderPosition>,
}

#[derive(Accounts)]
pub struct ClaimInsurance<'info> {
    #[account(mut)]
    pub lender: Signer<'info>,
    
    #[account(mut, seeds = [b"position", lender.key().as_ref()], bump)]
    pub position: Account<'info, LenderPosition>,
    
    #[account(mut, seeds = [b"liquidity_pool"], bump)]
    pub liquidity_pool: Account<'info, LiquidityPool>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub lender: Signer<'info>,
    
    #[account(mut)]
    pub position: Account<'info, LenderPosition>,
    
    #[account(mut, seeds = [b"liquidity_pool"], bump)]
    pub liquidity_pool: Account<'info, LiquidityPool>,
    
    #[account(mut)]
    pub lender_usdc: Account<'info, TokenAccount>,
    
    #[account(mut, seeds = [b"router_vault"], bump)]
    pub router_vault: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct UpdateStrategy<'info> {
    #[account(mut)]
    pub lender: Signer<'info>,
    
    #[account(mut, seeds = [b"position", lender.key().as_ref()], bump)]
    pub position: Account<'info, LenderPosition>,
}

#[derive(Accounts)]
pub struct AdminUpdate<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    
    #[account(mut, seeds = [b"router_config"], bump)]
    pub config: Account<'info, RouterConfig>,
}

#[derive(Accounts)]
pub struct GetPoolStats<'info> {
    #[account(seeds = [b"liquidity_pool"], bump)]
    pub liquidity_pool: Account<'info, LiquidityPool>,
}

// === DATA ACCOUNTS ===

#[account]
pub struct RouterConfig {
    pub admin: Pubkey,
    pub kamino_program: Pubkey,
    pub kamino_pool: Pubkey,
    pub kamino_rate_bps: u16,
    pub fee_bps: u16,
    pub bump: u8,
}

impl RouterConfig {
    pub const SIZE: usize = 32 + 32 + 32 + 2 + 2 + 1;
}

/// Global liquidity pool tracking
#[account]
pub struct LiquidityPool {
    /// Total USDC deposited across all lenders
    pub total_deposits: u64,
    /// Total USDC currently in P2P loans
    pub total_loaned: u64,
    /// Total USDC currently in Kamino
    pub total_in_kamino: u64,
    /// Insurance pool balance (1% of all interest)
    pub insurance_pool_balance: u64,
    pub bump: u8,
}

impl LiquidityPool {
    pub const SIZE: usize = 8 + 8 + 8 + 8 + 1;
}

/// Per-borrower exposure tracking (separate account per borrower)
#[account]
pub struct BorrowerExposure {
    /// Borrower pubkey
    pub borrower: Pubkey,
    /// Total exposure to this borrower across all lenders
    pub total_exposure: u64,
    pub bump: u8,
}

impl BorrowerExposure {
    pub const SIZE: usize = 32 + 8 + 1;
}

#[account]
pub struct LenderPosition {
    pub wallet: Pubkey,
    pub total_deposited: u64,
    pub in_kamino: u64,
    pub in_p2p: u64,
    pub min_p2p_rate_bps: u16,
    pub kamino_buffer_bps: u16,
    pub auto_route: bool,
    pub created_at: i64,
    pub updated_at: i64,
    pub bump: u8,
}

impl LenderPosition {
    pub const SIZE: usize = 32 + 8 + 8 + 8 + 2 + 2 + 1 + 8 + 8 + 1;
}

// === ERRORS ===

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Auto-route disabled")]
    AutoRouteDisabled,
    #[msg("Insufficient funds")]
    InsufficientFunds,
    #[msg("Exceeds max deposit of $100 USDC (mainnet safety)")]
    ExceedsMaxDeposit,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Insufficient insurance pool balance")]
    InsufficientInsurance,
    #[msg("Exceeds diversification cap")]
    ExceedsDiversificationCap,
}
