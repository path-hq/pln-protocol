use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("CRDTmk5GYLqSh8fPGvdMgdmAHxYhAuP5YzJfDL8W9Xyz");

/// PLN Protocol Credit Market
/// Enables undercollateralized lending with reputation-based risk assessment
/// and automated liquidation for past-due or unhealthy loans.
/// 
/// Interest fee split:
/// - 89% → Lender
/// - 10% → Insurance Pool
/// - 1%  → Protocol Treasury

// Fee constants in basis points (100 bps = 1%)
pub const INSURANCE_FEE_BPS: u64 = 1000;  // 10% of interest
pub const PROTOCOL_FEE_BPS: u64 = 100;    // 1% of interest
pub const LENDER_SHARE_BPS: u64 = 8900;   // 89% of interest

#[program]
pub mod credit_market {
    use super::*;

    /// Initialize the global state for the credit market
    pub fn initialize(
        ctx: Context<Initialize>,
        insurance_pool: Pubkey,
        treasury: Pubkey,
    ) -> Result<()> {
        let global_state = &mut ctx.accounts.global_state;
        global_state.admin = ctx.accounts.admin.key();
        global_state.next_loan_id = 1;
        global_state.fee_bps = PROTOCOL_FEE_BPS as u16; // 1% protocol fee
        global_state.insurance_fee_bps = INSURANCE_FEE_BPS as u16; // 10% insurance fee
        global_state.insurance_pool = insurance_pool;
        global_state.treasury = treasury;
        global_state.total_insurance_collected = 0;
        global_state.total_insurance_claimed = 0;
        global_state.whitelisted_programs = vec![];
        global_state.bump = ctx.bumps.global_state;

        emit!(MarketInitialized {
            admin: global_state.admin,
            insurance_pool,
            treasury,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Post a lending offer with configurable terms
    pub fn post_lend_offer(
        ctx: Context<PostLendOffer>,
        amount: u64,
        min_rate_bps: u16,
        max_duration_secs: u64,
        min_reputation: u16,
        liquidation_threshold_bps: u16,
    ) -> Result<()> {
        require!(amount > 0, CreditMarketError::InvalidAmount);
        require!(min_rate_bps <= 10000, CreditMarketError::InvalidRate);
        require!(max_duration_secs > 0, CreditMarketError::InvalidDuration);
        require!(
            liquidation_threshold_bps >= 5000 && liquidation_threshold_bps <= 10000,
            CreditMarketError::InvalidLiquidationThreshold
        );

        let offer = &mut ctx.accounts.offer;
        offer.lender = ctx.accounts.lender.key();
        offer.amount = amount;
        offer.min_rate_bps = min_rate_bps;
        offer.max_duration_secs = max_duration_secs;
        offer.min_reputation = min_reputation;
        offer.liquidation_threshold_bps = liquidation_threshold_bps;
        offer.is_active = true;
        offer.created_at = Clock::get()?.unix_timestamp;
        offer.bump = ctx.bumps.offer;

        // Transfer USDC to escrow vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.lender_usdc.to_account_info(),
            to: ctx.accounts.escrow_vault.to_account_info(),
            authority: ctx.accounts.lender.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        // Increment global offer counter
        let global_state = &mut ctx.accounts.global_state;
        global_state.next_loan_id = global_state.next_loan_id.checked_add(1)
            .ok_or(CreditMarketError::MathOverflow)?;

        emit!(LendOfferPosted {
            lender: offer.lender,
            amount,
            min_rate_bps,
            max_duration_secs,
            liquidation_threshold_bps,
            timestamp: offer.created_at,
        });

        Ok(())
    }

    /// Cancel an active lending offer and return funds
    pub fn cancel_lend_offer(ctx: Context<CancelLendOffer>) -> Result<()> {
        let offer = &mut ctx.accounts.offer;
        require!(offer.is_active, CreditMarketError::OfferNotActive);
        require!(
            offer.lender == ctx.accounts.lender.key(),
            CreditMarketError::Unauthorized
        );

        offer.is_active = false;

        // Return funds from escrow to lender
        let seeds = &[
            b"escrow",
            offer.lender.as_ref(),
            &[ctx.bumps.escrow_vault],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_vault.to_account_info(),
            to: ctx.accounts.lender_usdc.to_account_info(),
            authority: ctx.accounts.escrow_vault.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        token::transfer(cpi_ctx, offer.amount)?;

        emit!(LendOfferCancelled {
            lender: offer.lender,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Post a borrow request
    pub fn post_borrow_request(
        ctx: Context<PostBorrowRequest>,
        amount: u64,
        max_rate_bps: u16,
        duration_secs: u64,
    ) -> Result<()> {
        require!(amount > 0, CreditMarketError::InvalidAmount);
        require!(max_rate_bps <= 10000, CreditMarketError::InvalidRate);
        require!(duration_secs > 0, CreditMarketError::InvalidDuration);

        let request = &mut ctx.accounts.request;
        request.borrower = ctx.accounts.borrower.key();
        request.amount = amount;
        request.max_rate_bps = max_rate_bps;
        request.duration_secs = duration_secs;
        request.is_active = true;
        request.created_at = Clock::get()?.unix_timestamp;
        request.bump = ctx.bumps.request;

        emit!(BorrowRequestPosted {
            borrower: request.borrower,
            amount,
            max_rate_bps,
            duration_secs,
            timestamp: request.created_at,
        });

        Ok(())
    }

    /// Accept a lending offer (borrower accepts lender's terms)
    pub fn accept_lend_offer(ctx: Context<AcceptLendOffer>) -> Result<()> {
        let offer = &mut ctx.accounts.offer;
        require!(offer.is_active, CreditMarketError::OfferNotActive);

        // Check borrower reputation meets minimum
        let borrower_profile = &ctx.accounts.borrower_profile;
        require!(
            borrower_profile.reputation_score >= offer.min_reputation,
            CreditMarketError::InsufficientReputation
        );

        offer.is_active = false;

        let clock = Clock::get()?;
        let global_state = &mut ctx.accounts.global_state;
        let loan_id = global_state.next_loan_id;
        global_state.next_loan_id = loan_id.checked_add(1)
            .ok_or(CreditMarketError::MathOverflow)?;

        // Initialize loan
        let loan = &mut ctx.accounts.loan;
        loan.id = loan_id;
        loan.lender = offer.lender;
        loan.borrower = ctx.accounts.borrower.key();
        loan.principal = offer.amount;
        loan.rate_bps = offer.min_rate_bps;
        loan.start_time = clock.unix_timestamp;
        loan.end_time = clock.unix_timestamp
            .checked_add(offer.max_duration_secs as i64)
            .ok_or(CreditMarketError::MathOverflow)?;
        loan.status = LoanStatus::Active;
        loan.vault = ctx.accounts.loan_vault.key();
        loan.liquidation_threshold_bps = offer.liquidation_threshold_bps;
        loan.insurance_claimed = false;
        loan.bump = ctx.bumps.loan;

        // Transfer funds from escrow to loan vault (borrower can use via execute_trade)
        let escrow_seeds = &[
            b"escrow",
            offer.lender.as_ref(),
            &[ctx.bumps.escrow_vault],
        ];
        let signer_seeds = &[&escrow_seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_vault.to_account_info(),
            to: ctx.accounts.loan_vault.to_account_info(),
            authority: ctx.accounts.escrow_vault.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        token::transfer(cpi_ctx, offer.amount)?;

        emit!(LoanCreated {
            loan_id,
            lender: loan.lender,
            borrower: loan.borrower,
            principal: loan.principal,
            rate_bps: loan.rate_bps,
            end_time: loan.end_time,
            liquidation_threshold_bps: loan.liquidation_threshold_bps,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Repay a loan in full
    /// Interest is split: 89% to lender, 10% to insurance pool, 1% to protocol treasury
    pub fn repay_loan(ctx: Context<RepayLoan>) -> Result<()> {
        let loan = &mut ctx.accounts.loan;
        require!(loan.status == LoanStatus::Active, CreditMarketError::LoanNotActive);
        require!(
            loan.borrower == ctx.accounts.borrower.key(),
            CreditMarketError::Unauthorized
        );

        let clock = Clock::get()?;
        let global_state = &mut ctx.accounts.global_state;
        
        // Calculate total repayment with interest
        let duration_secs = clock.unix_timestamp
            .checked_sub(loan.start_time)
            .ok_or(CreditMarketError::MathOverflow)? as u64;
        let interest = calculate_interest(loan.principal, loan.rate_bps, duration_secs)?;
        
        // Split interest: 89% lender, 10% insurance, 1% protocol
        let insurance_fee = interest
            .checked_mul(INSURANCE_FEE_BPS)
            .ok_or(CreditMarketError::MathOverflow)?
            .checked_div(10000)
            .ok_or(CreditMarketError::MathOverflow)?;
        let protocol_fee = interest
            .checked_mul(PROTOCOL_FEE_BPS)
            .ok_or(CreditMarketError::MathOverflow)?
            .checked_div(10000)
            .ok_or(CreditMarketError::MathOverflow)?;
        let lender_interest = interest
            .checked_sub(insurance_fee)
            .ok_or(CreditMarketError::MathOverflow)?
            .checked_sub(protocol_fee)
            .ok_or(CreditMarketError::MathOverflow)?;
        
        // Amount to lender: principal + lender's share of interest
        let lender_amount = loan.principal
            .checked_add(lender_interest)
            .ok_or(CreditMarketError::MathOverflow)?;

        // Transfer principal + lender interest to lender
        let cpi_accounts = Transfer {
            from: ctx.accounts.borrower_usdc.to_account_info(),
            to: ctx.accounts.lender_usdc.to_account_info(),
            authority: ctx.accounts.borrower.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, lender_amount)?;

        // Transfer insurance fee to insurance pool
        if insurance_fee > 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.borrower_usdc.to_account_info(),
                to: ctx.accounts.insurance_pool.to_account_info(),
                authority: ctx.accounts.borrower.to_account_info(),
            };
            let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
            token::transfer(cpi_ctx, insurance_fee)?;
            
            // Track total insurance collected
            global_state.total_insurance_collected = global_state.total_insurance_collected
                .checked_add(insurance_fee)
                .ok_or(CreditMarketError::MathOverflow)?;
        }

        // Transfer protocol fee to treasury
        if protocol_fee > 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.borrower_usdc.to_account_info(),
                to: ctx.accounts.treasury.to_account_info(),
                authority: ctx.accounts.borrower.to_account_info(),
            };
            let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
            token::transfer(cpi_ctx, protocol_fee)?;
        }

        loan.status = LoanStatus::Repaid;

        // Update borrower reputation (+50 for successful repayment)
        let borrower_profile = &mut ctx.accounts.borrower_profile;
        borrower_profile.reputation_score = borrower_profile.reputation_score
            .checked_add(50)
            .unwrap_or(u16::MAX);
        borrower_profile.loans_repaid = borrower_profile.loans_repaid
            .checked_add(1)
            .ok_or(CreditMarketError::MathOverflow)?;

        emit!(LoanRepaid {
            loan_id: loan.id,
            borrower: loan.borrower,
            lender: loan.lender,
            principal: loan.principal,
            interest,
            lender_interest,
            insurance_fee,
            protocol_fee,
            total_repaid: loan.principal.checked_add(interest).ok_or(CreditMarketError::MathOverflow)?,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Execute a trade using borrowed funds (whitelisted programs only)
    pub fn execute_trade(
        ctx: Context<ExecuteTrade>,
        target_program: Pubkey,
        instruction_data: Vec<u8>,
    ) -> Result<()> {
        let loan = &ctx.accounts.loan;
        require!(loan.status == LoanStatus::Active, CreditMarketError::LoanNotActive);
        require!(
            loan.borrower == ctx.accounts.borrower.key(),
            CreditMarketError::Unauthorized
        );

        // Check if target program is whitelisted
        let config = &ctx.accounts.config;
        require!(
            config.whitelisted_programs.contains(&target_program),
            CreditMarketError::ProgramNotWhitelisted
        );

        // Execute CPI to whitelisted program
        // Note: Actual CPI implementation would go here
        // This is a simplified version for the MVP

        emit!(TradeExecuted {
            loan_id: loan.id,
            borrower: loan.borrower,
            target_program,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Liquidate an unhealthy or past-due loan
    /// Can be called by anyone (keeper bots) when conditions are met
    pub fn liquidate_loan(ctx: Context<LiquidateLoan>) -> Result<()> {
        let loan = &mut ctx.accounts.loan;
        require!(loan.status == LoanStatus::Active, CreditMarketError::LoanNotActive);

        let clock = Clock::get()?;
        
        // Check if loan is liquidatable
        let is_past_due = clock.unix_timestamp > loan.end_time;
        
        // Calculate health factor based on remaining vault balance vs. expected repayment
        let vault_balance = ctx.accounts.loan_vault.amount;
        let duration_secs = clock.unix_timestamp
            .checked_sub(loan.start_time)
            .ok_or(CreditMarketError::MathOverflow)? as u64;
        let interest = calculate_interest(loan.principal, loan.rate_bps, duration_secs)?;
        let expected_repayment = loan.principal
            .checked_add(interest)
            .ok_or(CreditMarketError::MathOverflow)?;
        
        // Health factor = (vault_balance * 10000) / expected_repayment
        let health_factor_bps = if expected_repayment > 0 {
            (vault_balance as u128)
                .checked_mul(10000)
                .ok_or(CreditMarketError::MathOverflow)?
                .checked_div(expected_repayment as u128)
                .ok_or(CreditMarketError::MathOverflow)? as u16
        } else {
            10000
        };

        let is_unhealthy = health_factor_bps < loan.liquidation_threshold_bps;

        require!(
            is_past_due || is_unhealthy,
            CreditMarketError::LoanNotLiquidatable
        );

        // Store values we need for seeds before borrowing
        let loan_id_bytes = loan.id.to_le_bytes();
        let loan_bump = loan.bump;

        // Transfer remaining vault funds to lender
        if vault_balance > 0 {
            let loan_seeds = &[
                b"loan",
                loan_id_bytes.as_ref(),
                &[loan_bump],
            ];
            let signer_seeds = &[&loan_seeds[..]];

            let cpi_accounts = Transfer {
                from: ctx.accounts.loan_vault.to_account_info(),
                to: ctx.accounts.lender_usdc.to_account_info(),
                authority: ctx.accounts.loan.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
            token::transfer(cpi_ctx, vault_balance)?;
        }

        // Now update loan status after the transfer
        let loan = &mut ctx.accounts.loan;
        loan.status = LoanStatus::Liquidated;

        // Penalize borrower reputation (-200 points, +1 default)
        let borrower_profile = &mut ctx.accounts.borrower_profile;
        borrower_profile.reputation_score = borrower_profile.reputation_score
            .saturating_sub(200);
        borrower_profile.defaults = borrower_profile.defaults
            .checked_add(1)
            .ok_or(CreditMarketError::MathOverflow)?;

        emit!(LoanLiquidated {
            loan_id: loan.id,
            borrower: loan.borrower,
            lender: loan.lender,
            liquidator: ctx.accounts.liquidator.key(),
            vault_balance_recovered: vault_balance,
            principal: loan.principal,
            health_factor_bps,
            is_past_due,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Mark a loan as defaulted (alternative to liquidation, used for accounting)
    pub fn mark_default(ctx: Context<MarkDefault>) -> Result<()> {
        let loan = &mut ctx.accounts.loan;
        require!(loan.status == LoanStatus::Active, CreditMarketError::LoanNotActive);

        let clock = Clock::get()?;
        require!(
            clock.unix_timestamp > loan.end_time,
            CreditMarketError::LoanNotOverdue
        );

        loan.status = LoanStatus::Defaulted;

        // Penalize borrower reputation
        let borrower_profile = &mut ctx.accounts.borrower_profile;
        borrower_profile.reputation_score = borrower_profile.reputation_score
            .saturating_sub(200);
        borrower_profile.defaults = borrower_profile.defaults
            .checked_add(1)
            .ok_or(CreditMarketError::MathOverflow)?;

        emit!(LoanDefaulted {
            loan_id: loan.id,
            borrower: loan.borrower,
            lender: loan.lender,
            principal: loan.principal,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Add a program to the whitelist (admin only)
    pub fn add_whitelisted_program(
        ctx: Context<AdminAction>,
        program_id: Pubkey,
    ) -> Result<()> {
        let global_state = &mut ctx.accounts.global_state;
        require!(
            global_state.admin == ctx.accounts.admin.key(),
            CreditMarketError::Unauthorized
        );

        if !global_state.whitelisted_programs.contains(&program_id) {
            global_state.whitelisted_programs.push(program_id);
        }

        Ok(())
    }

    /// Remove a program from the whitelist (admin only)
    pub fn remove_whitelisted_program(
        ctx: Context<AdminAction>,
        program_id: Pubkey,
    ) -> Result<()> {
        let global_state = &mut ctx.accounts.global_state;
        require!(
            global_state.admin == ctx.accounts.admin.key(),
            CreditMarketError::Unauthorized
        );

        global_state.whitelisted_programs.retain(|&p| p != program_id);

        Ok(())
    }

    /// Claim insurance payout for a defaulted loan
    /// Lenders can claim partial recovery from the insurance pool for defaulted loans
    pub fn claim_insurance(ctx: Context<ClaimInsurance>) -> Result<()> {
        let loan = &mut ctx.accounts.loan;
        require!(
            loan.status == LoanStatus::Defaulted || loan.status == LoanStatus::Liquidated,
            CreditMarketError::LoanNotDefaulted
        );
        require!(
            loan.lender == ctx.accounts.lender.key(),
            CreditMarketError::Unauthorized
        );
        require!(
            !loan.insurance_claimed,
            CreditMarketError::InsuranceAlreadyClaimed
        );

        let global_state = &mut ctx.accounts.global_state;
        let clock = Clock::get()?;

        // Calculate insurance payout: up to 50% of principal loss from insurance pool
        // This provides partial protection for lenders while maintaining pool sustainability
        let max_payout_rate_bps: u64 = 5000; // 50% coverage
        let payout = loan.principal
            .checked_mul(max_payout_rate_bps)
            .ok_or(CreditMarketError::MathOverflow)?
            .checked_div(10000)
            .ok_or(CreditMarketError::MathOverflow)?;

        // Check available insurance pool balance
        let pool_balance = ctx.accounts.insurance_pool.amount;
        let actual_payout = std::cmp::min(payout, pool_balance);
        
        require!(actual_payout > 0, CreditMarketError::InsufficientInsurancePool);

        // Transfer from insurance pool to lender
        let seeds = &[
            b"insurance_pool",
            &[ctx.bumps.insurance_pool],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.insurance_pool.to_account_info(),
            to: ctx.accounts.lender_usdc.to_account_info(),
            authority: ctx.accounts.insurance_pool.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        token::transfer(cpi_ctx, actual_payout)?;

        // Mark insurance as claimed
        loan.insurance_claimed = true;

        // Track total insurance claimed
        global_state.total_insurance_claimed = global_state.total_insurance_claimed
            .checked_add(actual_payout)
            .ok_or(CreditMarketError::MathOverflow)?;

        emit!(InsuranceClaimed {
            loan_id: loan.id,
            lender: loan.lender,
            borrower: loan.borrower,
            principal: loan.principal,
            payout: actual_payout,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Update insurance and protocol fee rates (admin only)
    pub fn update_fee_rates(
        ctx: Context<AdminAction>,
        new_insurance_fee_bps: Option<u16>,
        new_protocol_fee_bps: Option<u16>,
    ) -> Result<()> {
        let global_state = &mut ctx.accounts.global_state;
        
        if let Some(insurance_bps) = new_insurance_fee_bps {
            require!(insurance_bps <= 2000, CreditMarketError::InvalidFeeRate); // Max 20%
            global_state.insurance_fee_bps = insurance_bps;
        }
        
        if let Some(protocol_bps) = new_protocol_fee_bps {
            require!(protocol_bps <= 500, CreditMarketError::InvalidFeeRate); // Max 5%
            global_state.fee_bps = protocol_bps;
        }

        emit!(FeeRatesUpdated {
            insurance_fee_bps: global_state.insurance_fee_bps,
            protocol_fee_bps: global_state.fee_bps,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }
}

// ============================================================================
// Helper Functions
// ============================================================================

/// Calculate simple interest: principal * rate * duration / (365 days * 10000)
fn calculate_interest(principal: u64, rate_bps: u16, duration_secs: u64) -> Result<u64> {
    const SECONDS_PER_YEAR: u128 = 365 * 24 * 60 * 60;
    
    let interest = (principal as u128)
        .checked_mul(rate_bps as u128)
        .ok_or(CreditMarketError::MathOverflow)?
        .checked_mul(duration_secs as u128)
        .ok_or(CreditMarketError::MathOverflow)?
        .checked_div(SECONDS_PER_YEAR)
        .ok_or(CreditMarketError::MathOverflow)?
        .checked_div(10000)
        .ok_or(CreditMarketError::MathOverflow)?;
    
    Ok(interest as u64)
}

// ============================================================================
// Account Contexts
// ============================================================================

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        init,
        payer = admin,
        space = 8 + GlobalState::INIT_SPACE,
        seeds = [b"global_state"],
        bump,
    )]
    pub global_state: Account<'info, GlobalState>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PostLendOffer<'info> {
    #[account(mut)]
    pub lender: Signer<'info>,
    #[account(
        init,
        payer = lender,
        space = 8 + LendOffer::INIT_SPACE,
        seeds = [b"offer", lender.key().as_ref(), &global_state.next_loan_id.to_le_bytes()],
        bump,
    )]
    pub offer: Account<'info, LendOffer>,
    #[account(mut)]
    pub lender_usdc: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [b"escrow", lender.key().as_ref()],
        bump,
    )]
    pub escrow_vault: Account<'info, TokenAccount>,
    pub usdc_mint: Account<'info, anchor_spl::token::Mint>,
    #[account(
        mut,
        seeds = [b"global_state"],
        bump = global_state.bump,
    )]
    pub global_state: Account<'info, GlobalState>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelLendOffer<'info> {
    #[account(mut)]
    pub lender: Signer<'info>,
    #[account(
        mut,
        constraint = offer.lender == lender.key() @ CreditMarketError::Unauthorized,
    )]
    pub offer: Account<'info, LendOffer>,
    #[account(mut)]
    pub lender_usdc: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [b"escrow", lender.key().as_ref()],
        bump,
    )]
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
        space = 8 + BorrowRequest::INIT_SPACE,
        seeds = [b"request", borrower.key().as_ref()],
        bump,
    )]
    pub request: Account<'info, BorrowRequest>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AcceptLendOffer<'info> {
    #[account(mut)]
    pub borrower: Signer<'info>,
    #[account(
        mut,
        constraint = offer.is_active @ CreditMarketError::OfferNotActive,
    )]
    pub offer: Account<'info, LendOffer>,
    pub borrower_profile: Account<'info, BorrowerProfile>,
    #[account(
        init,
        payer = borrower,
        space = 8 + Loan::INIT_SPACE,
        seeds = [b"loan", &global_state.next_loan_id.to_le_bytes()],
        bump,
    )]
    pub loan: Account<'info, Loan>,
    #[account(
        mut,
        seeds = [b"loan_vault", &global_state.next_loan_id.to_le_bytes()],
        bump,
    )]
    pub loan_vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [b"escrow", offer.lender.as_ref()],
        bump,
    )]
    pub escrow_vault: Account<'info, TokenAccount>,
    pub usdc_mint: Account<'info, anchor_spl::token::Mint>,
    #[account(
        mut,
        seeds = [b"global_state"],
        bump = global_state.bump,
    )]
    pub global_state: Account<'info, GlobalState>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RepayLoan<'info> {
    #[account(mut)]
    pub borrower: Signer<'info>,
    #[account(
        mut,
        constraint = loan.borrower == borrower.key() @ CreditMarketError::Unauthorized,
        constraint = loan.status == LoanStatus::Active @ CreditMarketError::LoanNotActive,
    )]
    pub loan: Account<'info, Loan>,
    #[account(mut)]
    pub borrower_usdc: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = lender_usdc.owner == loan.lender,
    )]
    pub lender_usdc: Account<'info, TokenAccount>,
    /// Insurance pool receives 10% of interest
    #[account(
        mut,
        constraint = insurance_pool.key() == global_state.insurance_pool @ CreditMarketError::InvalidInsurancePool,
    )]
    pub insurance_pool: Account<'info, TokenAccount>,
    /// Treasury receives 1% of interest (protocol fee)
    #[account(
        mut,
        constraint = treasury.key() == global_state.treasury @ CreditMarketError::InvalidTreasury,
    )]
    pub treasury: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [b"global_state"],
        bump = global_state.bump,
    )]
    pub global_state: Account<'info, GlobalState>,
    #[account(mut)]
    pub borrower_profile: Account<'info, BorrowerProfile>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ExecuteTrade<'info> {
    pub borrower: Signer<'info>,
    #[account(
        constraint = loan.borrower == borrower.key() @ CreditMarketError::Unauthorized,
        constraint = loan.status == LoanStatus::Active @ CreditMarketError::LoanNotActive,
    )]
    pub loan: Account<'info, Loan>,
    #[account(mut)]
    pub loan_vault: Account<'info, TokenAccount>,
    /// CHECK: Target program for CPI
    pub target_program: UncheckedAccount<'info>,
    pub config: Account<'info, GlobalState>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct LiquidateLoan<'info> {
    /// Anyone can be the liquidator (keeper bots)
    pub liquidator: Signer<'info>,
    #[account(
        mut,
        constraint = loan.status == LoanStatus::Active @ CreditMarketError::LoanNotActive,
    )]
    pub loan: Account<'info, Loan>,
    #[account(
        mut,
        constraint = loan_vault.key() == loan.vault,
    )]
    pub loan_vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = lender_usdc.owner == loan.lender,
    )]
    pub lender_usdc: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = borrower_profile.owner == loan.borrower,
    )]
    pub borrower_profile: Account<'info, BorrowerProfile>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct MarkDefault<'info> {
    pub caller: Signer<'info>,
    #[account(
        mut,
        constraint = loan.status == LoanStatus::Active @ CreditMarketError::LoanNotActive,
    )]
    pub loan: Account<'info, Loan>,
    #[account(
        mut,
        constraint = borrower_profile.owner == loan.borrower,
    )]
    pub borrower_profile: Account<'info, BorrowerProfile>,
}

#[derive(Accounts)]
pub struct AdminAction<'info> {
    pub admin: Signer<'info>,
    #[account(
        mut,
        seeds = [b"global_state"],
        bump = global_state.bump,
        constraint = global_state.admin == admin.key() @ CreditMarketError::Unauthorized,
    )]
    pub global_state: Account<'info, GlobalState>,
}

#[derive(Accounts)]
pub struct ClaimInsurance<'info> {
    #[account(mut)]
    pub lender: Signer<'info>,
    #[account(
        mut,
        constraint = loan.lender == lender.key() @ CreditMarketError::Unauthorized,
        constraint = (loan.status == LoanStatus::Defaulted || loan.status == LoanStatus::Liquidated) @ CreditMarketError::LoanNotDefaulted,
        constraint = !loan.insurance_claimed @ CreditMarketError::InsuranceAlreadyClaimed,
    )]
    pub loan: Account<'info, Loan>,
    #[account(
        mut,
        seeds = [b"insurance_pool"],
        bump,
    )]
    pub insurance_pool: Account<'info, TokenAccount>,
    #[account(mut)]
    pub lender_usdc: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [b"global_state"],
        bump = global_state.bump,
    )]
    pub global_state: Account<'info, GlobalState>,
    pub token_program: Program<'info, Token>,
}

// ============================================================================
// Account Structures
// ============================================================================

#[account]
#[derive(InitSpace)]
pub struct GlobalState {
    pub admin: Pubkey,
    pub next_loan_id: u64,
    pub fee_bps: u16,                      // Protocol fee: 1% (100 bps)
    pub insurance_fee_bps: u16,            // Insurance fee: 10% (1000 bps)
    pub insurance_pool: Pubkey,            // Insurance pool token account
    pub treasury: Pubkey,                  // Protocol treasury token account
    pub total_insurance_collected: u64,    // Total insurance fees collected
    pub total_insurance_claimed: u64,      // Total insurance payouts claimed
    #[max_len(20)]
    pub whitelisted_programs: Vec<Pubkey>,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct LendOffer {
    pub lender: Pubkey,
    pub amount: u64,
    pub min_rate_bps: u16,
    pub max_duration_secs: u64,
    pub min_reputation: u16,
    pub liquidation_threshold_bps: u16,  // NEW: e.g., 8000 = 80%
    pub is_active: bool,
    pub created_at: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct BorrowRequest {
    pub borrower: Pubkey,
    pub amount: u64,
    pub max_rate_bps: u16,
    pub duration_secs: u64,
    pub is_active: bool,
    pub created_at: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
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
    pub liquidation_threshold_bps: u16,  // Copied from offer at loan creation
    pub insurance_claimed: bool,         // Whether lender has claimed insurance for default
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct BorrowerProfile {
    pub owner: Pubkey,
    pub reputation_score: u16,
    pub loans_repaid: u32,
    pub defaults: u32,
    pub total_borrowed: u64,
    pub created_at: i64,
    pub bump: u8,
}

// ============================================================================
// Enums
// ============================================================================

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum LoanStatus {
    Open,       // Offer/request created, not yet matched
    Active,     // Loan is active, borrower has funds
    Repaid,     // Borrower repaid in full
    Defaulted,  // Past due, marked as default
    Liquidated, // Force-closed due to past due or unhealthy position
}

impl Default for LoanStatus {
    fn default() -> Self {
        LoanStatus::Open
    }
}

// ============================================================================
// Events
// ============================================================================

#[event]
pub struct MarketInitialized {
    pub admin: Pubkey,
    pub insurance_pool: Pubkey,
    pub treasury: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct LendOfferPosted {
    pub lender: Pubkey,
    pub amount: u64,
    pub min_rate_bps: u16,
    pub max_duration_secs: u64,
    pub liquidation_threshold_bps: u16,
    pub timestamp: i64,
}

#[event]
pub struct LendOfferCancelled {
    pub lender: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct BorrowRequestPosted {
    pub borrower: Pubkey,
    pub amount: u64,
    pub max_rate_bps: u16,
    pub duration_secs: u64,
    pub timestamp: i64,
}

#[event]
pub struct LoanCreated {
    pub loan_id: u64,
    pub lender: Pubkey,
    pub borrower: Pubkey,
    pub principal: u64,
    pub rate_bps: u16,
    pub end_time: i64,
    pub liquidation_threshold_bps: u16,
    pub timestamp: i64,
}

#[event]
pub struct LoanRepaid {
    pub loan_id: u64,
    pub borrower: Pubkey,
    pub lender: Pubkey,
    pub principal: u64,
    pub interest: u64,
    pub lender_interest: u64,    // 89% of interest
    pub insurance_fee: u64,      // 10% of interest → insurance pool
    pub protocol_fee: u64,       // 1% of interest → treasury
    pub total_repaid: u64,
    pub timestamp: i64,
}

#[event]
pub struct TradeExecuted {
    pub loan_id: u64,
    pub borrower: Pubkey,
    pub target_program: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct LoanLiquidated {
    pub loan_id: u64,
    pub borrower: Pubkey,
    pub lender: Pubkey,
    pub liquidator: Pubkey,
    pub vault_balance_recovered: u64,
    pub principal: u64,
    pub health_factor_bps: u16,
    pub is_past_due: bool,
    pub timestamp: i64,
}

#[event]
pub struct LoanDefaulted {
    pub loan_id: u64,
    pub borrower: Pubkey,
    pub lender: Pubkey,
    pub principal: u64,
    pub timestamp: i64,
}

#[event]
pub struct InsuranceClaimed {
    pub loan_id: u64,
    pub lender: Pubkey,
    pub borrower: Pubkey,
    pub principal: u64,
    pub payout: u64,
    pub timestamp: i64,
}

#[event]
pub struct FeeRatesUpdated {
    pub insurance_fee_bps: u16,
    pub protocol_fee_bps: u16,
    pub timestamp: i64,
}

// ============================================================================
// Errors
// ============================================================================

#[error_code]
pub enum CreditMarketError {
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
    #[msg("Loan not liquidatable - neither past due nor below health threshold")]
    LoanNotLiquidatable,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Invalid rate")]
    InvalidRate,
    #[msg("Invalid duration")]
    InvalidDuration,
    #[msg("Invalid liquidation threshold - must be between 5000 and 10000 bps")]
    InvalidLiquidationThreshold,
    #[msg("Loan not defaulted - insurance can only be claimed for defaulted or liquidated loans")]
    LoanNotDefaulted,
    #[msg("Insurance already claimed for this loan")]
    InsuranceAlreadyClaimed,
    #[msg("Insufficient insurance pool balance")]
    InsufficientInsurancePool,
    #[msg("Invalid insurance pool address")]
    InvalidInsurancePool,
    #[msg("Invalid treasury address")]
    InvalidTreasury,
    #[msg("Invalid fee rate - exceeds maximum allowed")]
    InvalidFeeRate,
}
