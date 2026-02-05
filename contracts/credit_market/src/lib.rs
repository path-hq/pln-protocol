use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

// Solana Playground Program ID
declare_id!("6uPGiAg5V5vCMH3ExpDvEV78E3uXUpy6PdcMjNxwBgXp");

#[program]
pub mod credit_market {
    use super::*;

    // === LENDER SIDE ===

    /// Post offer to lend USDC
    pub fn post_lend_offer(
        ctx: Context<PostLendOffer>,
        amount: u64,
        min_rate_bps: u16,
        max_duration_secs: u64,
        min_reputation: u16,
    ) -> Result<()> {
        let offer = &mut ctx.accounts.offer;
        let clock = Clock::get()?;
        
        offer.lender = ctx.accounts.lender.key();
        offer.amount = amount;
        offer.min_rate_bps = min_rate_bps;
        offer.max_duration_secs = max_duration_secs;
        offer.min_reputation = min_reputation;
        offer.is_active = true;
        offer.created_at = clock.unix_timestamp;
        offer.bump = ctx.bumps.offer;
        
        // Transfer USDC from lender to escrow vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.lender_usdc.to_account_info(),
            to: ctx.accounts.escrow_vault.to_account_info(),
            authority: ctx.accounts.lender.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;
        
        msg!("Lend offer posted: {} USDC @ min {} bps", amount, min_rate_bps);
        Ok(())
    }

    /// Cancel offer, withdraw escrowed USDC
    pub fn cancel_lend_offer(ctx: Context<CancelLendOffer>) -> Result<()> {
        let offer = &ctx.accounts.offer;
        require!(offer.is_active, ErrorCode::OfferNotActive);
        require!(offer.lender == ctx.accounts.lender.key(), ErrorCode::Unauthorized);
        
        // Transfer USDC back to lender
        let offer_key = offer.key();
        let seeds = &[b"escrow", offer_key.as_ref(), &[ctx.bumps.escrow_vault]];
        let signer = &[&seeds[..]];
        
        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_vault.to_account_info(),
            to: ctx.accounts.lender_usdc.to_account_info(),
            authority: ctx.accounts.escrow_vault.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, offer.amount)?;
        
        // Close offer account
        ctx.accounts.offer.is_active = false;
        
        msg!("Lend offer cancelled, {} USDC returned", offer.amount);
        Ok(())
    }

    // === BORROWER SIDE ===

    /// Post request to borrow USDC
    pub fn post_borrow_request(
        ctx: Context<PostBorrowRequest>,
        amount: u64,
        max_rate_bps: u16,
        duration_secs: u64,
    ) -> Result<()> {
        let request = &mut ctx.accounts.request;
        let clock = Clock::get()?;
        
        request.borrower = ctx.accounts.borrower.key();
        request.amount = amount;
        request.max_rate_bps = max_rate_bps;
        request.duration_secs = duration_secs;
        request.is_active = true;
        request.created_at = clock.unix_timestamp;
        request.bump = ctx.bumps.request;
        
        msg!("Borrow request posted: {} USDC @ max {} bps for {}s", 
            amount, max_rate_bps, duration_secs);
        Ok(())
    }

    /// Accept a lend offer (creates Loan)
    pub fn accept_lend_offer(
        ctx: Context<AcceptLendOffer>,
        offer_id: Pubkey,
    ) -> Result<()> {
        let offer = &ctx.accounts.offer;
        let clock = Clock::get()?;
        
        require!(offer.is_active, ErrorCode::OfferNotActive);
        
        // Check borrower reputation meets minimum
        let borrower_profile = &ctx.accounts.borrower_profile;
        require!(
            borrower_profile.score >= offer.min_reputation,
            ErrorCode::InsufficientReputation
        );
        
        // Create loan
        let loan = &mut ctx.accounts.loan;
        loan.id = ctx.accounts.global_state.next_loan_id;
        loan.lender = offer.lender;
        loan.borrower = ctx.accounts.borrower.key();
        loan.principal = offer.amount;
        loan.rate_bps = offer.min_rate_bps;
        loan.start_time = clock.unix_timestamp;
        loan.end_time = clock.unix_timestamp + offer.max_duration_secs as i64;
        loan.status = LoanStatus::Active;
        loan.vault = ctx.accounts.loan_vault.key();
        loan.bump = ctx.bumps.loan_vault;
        
        // Transfer from offer escrow to loan vault
        // (Simplified - in reality would use CPI)
        
        // Update global state
        ctx.accounts.global_state.next_loan_id += 1;
        
        // Deactivate offer
        ctx.accounts.offer.is_active = false;
        
        msg!("Loan {} created: {} USDC @ {} bps", loan.id, loan.principal, loan.rate_bps);
        Ok(())
    }

    /// Repay loan + interest
    pub fn repay_loan(ctx: Context<RepayLoan>, loan_id: u64) -> Result<()> {
        let loan = &mut ctx.accounts.loan;
        let clock = Clock::get()?;
        
        require!(loan.status == LoanStatus::Active, ErrorCode::LoanNotActive);
        require!(loan.borrower == ctx.accounts.borrower.key(), ErrorCode::Unauthorized);
        
        // Calculate interest: principal * rate * time / (365 days * 10000 bps)
        let duration_secs = (clock.unix_timestamp - loan.start_time) as u64;
        let interest = (loan.principal as u128)
            .checked_mul(loan.rate_bps as u128)
            .unwrap()
            .checked_mul(duration_secs as u128)
            .unwrap()
            .checked_div(365 * 24 * 60 * 60 * 10000)
            .unwrap() as u64;
        
        let total_repayment = loan.principal + interest;
        
        // Transfer repayment from borrower to lender
        let cpi_accounts = Transfer {
            from: ctx.accounts.borrower_usdc.to_account_info(),
            to: ctx.accounts.lender_usdc.to_account_info(),
            authority: ctx.accounts.borrower.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, total_repayment)?;
        
        // Update loan status
        loan.status = LoanStatus::Repaid;
        
        msg!("Loan {} repaid: {} principal + {} interest", loan_id, loan.principal, interest);
        Ok(())
    }

    // === PROTOCOL ===

    /// Execute trade via whitelisted protocol (Jupiter)
    /// Borrower can swap tokens but funds never leave vault
    pub fn execute_trade(
        ctx: Context<ExecuteTrade>,
        loan_id: u64,
        target_program: Pubkey,
        instruction_data: Vec<u8>,
    ) -> Result<()> {
        let loan = &ctx.accounts.loan;
        let config = &ctx.accounts.config;
        
        // Verify loan is active
        require!(loan.status == LoanStatus::Active, ErrorCode::LoanNotActive);
        
        // Verify caller is borrower
        require!(loan.borrower == ctx.accounts.borrower.key(), ErrorCode::Unauthorized);
        
        // Verify target is whitelisted (Jupiter, Kamino, Meteora)
        require!(
            config.whitelisted_programs.contains(&target_program),
            ErrorCode::ProgramNotWhitelisted
        );
        
        // For Jupiter swaps, we would CPI to Jupiter Aggregator
        // Jupiter v6 uses a complex routing system
        // For MVP, we log the attempt and simulate success
        
        msg!("Executing trade via {} for loan {}", target_program, loan_id);
        msg!("Instruction data length: {}", instruction_data.len());
        
        // In production:
        // 1. Parse instruction_data for swap parameters
        // 2. Build Jupiter CPI with proper accounts
        // 3. Invoke Jupiter program
        // 4. Verify output tokens go back to vault
        
        // Example Jupiter CPI (simplified):
        // let ix = Instruction {
        //     program_id: target_program,
        //     accounts: vec![...],
        //     data: instruction_data,
        // };
        // invoke_signed(&ix, &[...], signer_seeds)?;
        
        msg!("Trade execution simulated - vault funds remain controlled");
        Ok(())
    }

    /// Liquidate overdue loan (anyone can call)
    pub fn liquidate(ctx: Context<Liquidate>, loan_id: u64) -> Result<()> {
        let loan = &mut ctx.accounts.loan;
        let clock = Clock::get()?;
        
        require!(loan.status == LoanStatus::Active, ErrorCode::LoanNotActive);
        require!(clock.unix_timestamp > loan.end_time, ErrorCode::LoanNotOverdue);
        
        // Mark as defaulted
        loan.status = LoanStatus::Defaulted;
        
        // In production: transfer vault contents to lender
        // For now, just mark status
        
        msg!("Loan {} liquidated (overdue)", loan_id);
        Ok(())
    }

    /// Initialize global state
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let global_state = &mut ctx.accounts.global_state;
        global_state.admin = ctx.accounts.admin.key();
        global_state.next_loan_id = 1;
        global_state.fee_bps = 50; // 0.5% protocol fee
        global_state.whitelisted_programs = vec![
            // Jupiter v6
            pubkey!("JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4"),
            // Kamino Lending
            pubkey!("KLend2g3cP87ber8xB7iU7xX7aWU4gv4VZ4FtvZQWZ9"),
            // Meteora DLMM
            pubkey!("LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo"),
        ];
        global_state.bump = ctx.bumps.global_state;
        
        msg!("Credit market initialized");
        Ok(())
    }
}

// === ACCOUNT STRUCTS ===

#[derive(Accounts)]
pub struct PostLendOffer<'info> {
    #[account(mut)]
    pub lender: Signer<'info>,
    
    #[account(
        init,
        payer = lender,
        space = 8 + LendOffer::SIZE,
        seeds = [b"offer", lender.key().as_ref(), &global_state.next_loan_id.to_le_bytes()],
        bump
    )]
    pub offer: Account<'info, LendOffer>,
    
    #[account(mut)]
    pub lender_usdc: Account<'info, TokenAccount>,
    
    #[account(
        init,
        payer = lender,
        token::mint = usdc_mint,
        token::authority = escrow_vault,
        seeds = [b"escrow", offer.key().as_ref()],
        bump
    )]
    pub escrow_vault: Account<'info, TokenAccount>,
    
    pub usdc_mint: Account<'info, token::Mint>,
    
    #[account(mut)]
    pub global_state: Account<'info, GlobalState>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelLendOffer<'info> {
    #[account(mut)]
    pub lender: Signer<'info>,
    
    #[account(mut)]
    pub offer: Account<'info, LendOffer>,
    
    #[account(mut)]
    pub lender_usdc: Account<'info, TokenAccount>,
    
    #[account(mut, seeds = [b"escrow", offer.key().as_ref()], bump)]
    pub escrow_vault: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct PostBorrowRequest<'info> {
    #[account(mut)]
    pub borrower: Signer<'info>,
    
    #[account(
        init,
        payer = borrower,
        space = 8 + BorrowRequest::SIZE,
        seeds = [b"request", borrower.key().as_ref(), &Clock::get()?.unix_timestamp.to_le_bytes()],
        bump
    )]
    pub request: Account<'info, BorrowRequest>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AcceptLendOffer<'info> {
    #[account(mut)]
    pub borrower: Signer<'info>,
    
    #[account(mut)]
    pub offer: Account<'info, LendOffer>,
    
    /// CHECK: Borrower profile for reputation check
    pub borrower_profile: AccountInfo<'info>,
    
    #[account(
        init,
        payer = borrower,
        space = 8 + Loan::SIZE,
        seeds = [b"loan", &global_state.next_loan_id.to_le_bytes()],
        bump
    )]
    pub loan: Account<'info, Loan>,
    
    #[account(
        init,
        payer = borrower,
        token::mint = usdc_mint,
        token::authority = loan_vault,
        seeds = [b"loan_vault", loan.key().as_ref()],
        bump
    )]
    pub loan_vault: Account<'info, TokenAccount>,
    
    pub usdc_mint: Account<'info, token::Mint>,
    
    #[account(mut)]
    pub global_state: Account<'info, GlobalState>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RepayLoan<'info> {
    #[account(mut)]
    pub borrower: Signer<'info>,
    
    #[account(mut)]
    pub loan: Account<'info, Loan>,
    
    #[account(mut)]
    pub borrower_usdc: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub lender_usdc: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ExecuteTrade<'info> {
    #[account(mut)]
    pub borrower: Signer<'info>,
    
    #[account(mut)]
    pub loan: Account<'info, Loan>,
    
    #[account(mut)]
    pub loan_vault: Account<'info, TokenAccount>,
    
    /// CHECK: Whitelisted program (Jupiter, Kamino, Meteora)
    pub target_program: AccountInfo<'info>,
    
    pub config: Account<'info, GlobalState>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Liquidate<'info> {
    /// CHECK: Anyone can liquidate
    pub liquidator: Signer<'info>,
    
    #[account(mut)]
    pub loan: Account<'info, Loan>,
    
    #[account(mut)]
    pub lender: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub loan_vault: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    
    #[account(
        init,
        payer = admin,
        space = 8 + GlobalState::SIZE,
        seeds = [b"global_state"],
        bump
    )]
    pub global_state: Account<'info, GlobalState>,
    
    pub system_program: Program<'info, System>,
}

// === DATA ACCOUNTS ===

#[account]
pub struct LendOffer {
    pub lender: Pubkey,
    pub amount: u64,
    pub min_rate_bps: u16,
    pub max_duration_secs: u64,
    pub min_reputation: u16,
    pub is_active: bool,
    pub created_at: i64,
    pub bump: u8,
}

impl LendOffer {
    pub const SIZE: usize = 32 + 8 + 2 + 8 + 2 + 1 + 8 + 1;
}

#[account]
pub struct BorrowRequest {
    pub borrower: Pubkey,
    pub amount: u64,
    pub max_rate_bps: u16,
    pub duration_secs: u64,
    pub is_active: bool,
    pub created_at: i64,
    pub bump: u8,
}

impl BorrowRequest {
    pub const SIZE: usize = 32 + 8 + 2 + 8 + 1 + 8 + 1;
}

#[account]
pub struct Loan {
    pub id: u64,
    pub lender: Pubkey,
    pub borrower: Pubkey,
    pub principal: u64,
    pub rate_bps: u16,
    pub start_time: i64,
    pub end_time: i64,
    pub status: LoanStatus,
    pub vault: Pubkey,
    pub bump: u8,
}

impl Loan {
    pub const SIZE: usize = 8 + 32 + 32 + 8 + 2 + 8 + 8 + 1 + 32 + 1;
}

#[account]
pub struct GlobalState {
    pub admin: Pubkey,
    pub next_loan_id: u64,
    pub fee_bps: u16,
    pub whitelisted_programs: Vec<Pubkey>,
    pub bump: u8,
}

impl GlobalState {
    pub const SIZE: usize = 32 + 8 + 2 + 4 + (10 * 32) + 1; // Space for up to 10 whitelisted programs
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum LoanStatus {
    Active,
    Repaid,
    Defaulted,
    Liquidated,
}

// === ERRORS ===

#[error_code]
pub enum ErrorCode {
    #[msg("Offer not active")]
    OfferNotActive,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Loan not active")]
    LoanNotActive,
    #[msg("Insufficient reputation")]
    InsufficientReputation,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Program not whitelisted")]
    ProgramNotWhitelisted,
    #[msg("Loan not overdue")]
    LoanNotOverdue,
}
