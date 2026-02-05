use anchor_lang::prelude::*;
use anchor_spl::token_interface::{spl_token_2022::instruction::AuthorityType, Token2022, TokenAccount, TransferHookAccount};

declare_id!("HzCsdK6z72yY1nE6eP2x201m854hB22N4U23b8z5L");

#[program]
pub mod transfer_hook {
    use super::*;

    pub fn transfer_hook(ctx: Context<Token2022TransferHook>) -> Result<()> {
        let config = &ctx.accounts.whitelist_config;
        let destination_program = ctx.accounts.destination_account_owner.key();

        // Check if the destination program is whitelisted
        require!(config.whitelisted_programs.contains(&destination_program), TransferHookError::DestinationNotWhitelisted);

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Token2022TransferHook<'info> {
    #[account(token::mint = token_mint, token::authority = source_account_owner)]
    pub source_account: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(token::mint = token_mint)]
    pub token_mint: Box<InterfaceAccount<'info, Token2022>>,
    /// CHECK: The delegate account
    pub delegate_account: AccountInfo<'info>,
    #[account(token::mint = token_mint)]
    pub destination_account: Box<InterfaceAccount<'info, TokenAccount>>,
    /// CHECK: The authority of the destination account
    pub destination_account_owner: AccountInfo<'info>,
    /// CHECK: The owner of the source account
    pub source_account_owner: AccountInfo<'info>,
    /// CHECK: Extra metas account
    pub extra_metas_account: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
    /// CHECK: This is the spl token program
    pub token_program: AccountInfo<'info>,
    /// CHECK: Whitelist config PDA from B5 - will be refined
    pub whitelist_config: Account<'info, WhitelistConfig>,
}

#[account]
pub struct WhitelistConfig {
    pub whitelisted_programs: Vec<Pubkey>,
    pub bump: u8,
}

#[error_code]
pub enum TransferHookError {
    #[msg("Destination program is not whitelisted by PLN protocol.")]
    DestinationNotWhitelisted,
}
