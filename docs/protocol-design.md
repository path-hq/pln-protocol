# PLN Protocol Design Answers

## Oracle for Kamino rates
**Design Decision:** Initially, we will use a hardcoded value or a manual update mechanism for Kamino rates. For a more robust solution post-hackathon, we will integrate a decentralized oracle solution (e.g., Pyth Network or Switchboard) to fetch real-time Kamino rates. This will require an on-chain program to consume oracle price feeds.

## Liquidation mechanism
**Design Decision:** The Credit Market Program includes a basic `liquidate` instruction. Liquidation will be triggered when a borrower's health factor falls below a predefined threshold (e.g., collateral value drops relative to loan amount, or loan repayment is overdue). Initially, this trigger will be off-chain (e.g., a keeper bot monitoring agent health factors). The liquidation process involves transferring remaining collateral to the liquidator and closing the loan.

## Fee structure
**Design Decision:**
*   **Protocol Fees:** A small percentage fee (e.g., 0.1%) on loan originations charged to borrowers, and potentially a percentage of interest earned charged to lenders. This will be configurable via a governance mechanism or an admin key.
*   **Transaction Fees (Solana):** Standard Solana transaction fees (lamports) apply to all on-chain interactions.

## Interest rate model
**Design Decision:** Initially, a simple fixed interest rate or a manually configurable rate will be implemented within the Credit Market Program for P2P loans. The Liquidity Router will use available Kamino rates as a benchmark and dynamically rebalance funds to optimize yield based on a configurable `min_p2p_rate_bps` and `kamino_buffer_bps`.

## Loan duration / terms
**Design Decision:** Loans will have fixed durations (e.g., 24 hours, 7 days) with clear repayment deadlines. Auto-liquidation will be enabled for overdue or under-collateralized loans. These terms will be set by lenders when creating offers and agreed upon by borrowers.

## Whitelist enforcement
**Design Decision:** Whitelist enforcement is primarily handled by the **Token-2022 Transfer Hook Program**. This program ensures that borrowed USDC can only be transferred to a predefined set of whitelisted program IDs (e.g., Jupiter, Kamino, Meteora). This prevents misuse of borrowed funds. Additionally, Credit Accounts or agent-specific whitelists can be implemented further to restrict actions based on agent reputation and permissions.
