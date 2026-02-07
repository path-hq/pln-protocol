use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount};

declare_id!("7h528dSk5NWWsfBBXA51EdYFZ9XHGsAVEd56smWjKBgg"); // Will be replaced on deploy

#[program]
pub mod transfer_hook {
    use super::*;

    pub fn transfer_hook(ctx: Context<TransferHookCtx>) -> Result<()> {
        let config = &ctx.accounts.whitelist_config;
        let destination_owner = ctx.accounts.destination_account.owner;

        // Check if the destination account owner is a whitelisted program
        require!(
            config.whitelisted_programs.contains(&destination_owner),
            TransferHookError::DestinationNotWhitelisted
        );
        Ok(())
    }

    pub fn initialize_whitelist(
        ctx: Context<InitializeWhitelist>,
        programs: Vec<Pubkey>,
    ) -> Result<()> {
        let config = &mut ctx.accounts.whitelist_config;
        config.whitelisted_programs = programs;
        config.authority = ctx.accounts.authority.key();
        config.bump = ctx.bumps.whitelist_config;
        Ok(())
    }

    pub fn update_whitelist(
        ctx: Context<UpdateWhitelist>,
        programs: Vec<Pubkey>,
    ) -> Result<()> {
        let config = &mut ctx.accounts.whitelist_config;
        require!(
            config.authority == ctx.accounts.authority.key(),
            TransferHookError::Unauthorized
        );
        config.whitelisted_programs = programs;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct TransferHookCtx<'info> {
    /// CHECK: Source token account
    pub source_account: InterfaceAccount<'info, TokenAccount>,
    pub mint: InterfaceAccount<'info, Mint>,
    /// CHECK: Destination token account
    pub destination_account: InterfaceAccount<'info, TokenAccount>,
    /// CHECK: Owner of source
    pub owner: UncheckedAccount<'info>,
    /// CHECK: Extra account metas PDA
    pub extra_account_meta_list: UncheckedAccount<'info>,
    #[account(
        seeds = [b"whitelist"],
        bump = whitelist_config.bump,
    )]
    pub whitelist_config: Account<'info, WhitelistConfig>,
}

#[derive(Accounts)]
pub struct InitializeWhitelist<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 4 + (32 * 10) + 32 + 1, // discriminator + vec len + 10 pubkeys max + authority + bump
        seeds = [b"whitelist"],
        bump,
    )]
    pub whitelist_config: Account<'info, WhitelistConfig>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateWhitelist<'info> {
    #[account(
        mut,
        seeds = [b"whitelist"],
        bump = whitelist_config.bump,
    )]
    pub whitelist_config: Account<'info, WhitelistConfig>,
    pub authority: Signer<'info>,
}

#[account]
pub struct WhitelistConfig {
    pub whitelisted_programs: Vec<Pubkey>,
    pub authority: Pubkey,
    pub pub bump: u8, // Corrected from `pub bump: u8` to `pub bump: u8`.
}

#[error_code]
pub enum TransferHookError {
    #[msg("Destination program is not whitelisted by PLN protocol.")]
    DestinationNotWhitelisted,
    #[msg("Unauthorized to update whitelist.")]
    Unauthorized,
}
