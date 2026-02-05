use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

// Solana Playground Program ID
declare_id!("11111111111111111111111111111111");

/// LIQUIDITY ROUTER
/// Auto-routes lender funds between Kamino (passive) and P2P loans (active)
/// Solves cold start: funds always earn something
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
        
        msg!("Router initialized with Kamino @ {} bps", config.kamino_rate_bps);
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
            msg!("Routed {} USDC to P2P loan", amount);
        } else {
            // Route to Kamino for passive yield
            position.in_kamino += amount;
            
            // CPI to Kamino deposit (simplified for MVP)
            // In production: actual Kamino CPI call
            msg!("Routed {} USDC to Kamino @ {} bps", amount, ctx.accounts.config.kamino_rate_bps);
        }
        
        position.total_deposited += amount;
        position.updated_at = clock.unix_timestamp;
        
        // Transfer USDC from lender to router vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.lender_usdc.to_account_info(),
            to: ctx.accounts.router_vault.to_account_info(),
            authority: ctx.accounts.lender.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
        token::transfer(cpi_ctx, amount)?;
        
        msg!("Deposit complete. Total: {} USDC", position.total_deposited);
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

    /// Called when loan is repaid
    /// Routes funds back to Kamino or next P2P opportunity
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
        // In production: check borrow request queue
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

    /// Lender withdraws funds
    /// Priority: Kamino first (liquid), then P2P if possible
    pub fn withdraw(
        ctx: Context<Withdraw>,
        amount: u64,
    ) -> Result<()> {
        let position = &mut ctx.accounts.position;
        
        require!(position.wallet == ctx.accounts.lender.key(), ErrorCode::Unauthorized);
        
        // First withdraw from Kamino (liquid)
        let from_kamino = amount.min(position.in_kamino);
        if from_kamino > 0 {
            position.in_kamino -= from_kamino;
            // In production: CPI to withdraw from Kamino
            msg!("Withdrew {} USDC from Kamino", from_kamino);
        }
        
        // If need more, try P2P
        let remaining = amount - from_kamino;
        if remaining > 0 {
            let from_p2p = remaining.min(position.in_p2p);
            if from_p2p > 0 {
                position.in_p2p -= from_p2p;
                msg!("Withdrew {} USDC from P2P (may need loan exit)", from_p2p);
            }
            
            // If still need more, queue withdrawal
            if remaining > from_p2p {
                msg!("Queued {} USDC for withdrawal when loans repay", remaining - from_p2p);
                // In production: add to withdrawal queue
            }
        }
        
        position.total_deposited -= amount;
        
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
pub struct OnBorrowRequest<'info> {
    /// CHECK: Credit market program that calls this
    pub authority: Signer<'info>,
    
    #[account(mut)]
    pub position: Account<'info, LenderPosition>,
    
    pub config: Account<'info, RouterConfig>,
}

#[derive(Accounts)]
pub struct OnLoanRepaid<'info> {
    /// CHECK: Credit market program that calls this
    pub authority: Signer<'info>,
    
    #[account(mut)]
    pub position: Account<'info, LenderPosition>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub lender: Signer<'info>,
    
    #[account(mut)]
    pub position: Account<'info, LenderPosition>,
    
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
}
