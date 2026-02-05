# Linear Tasks Summary for PATH Liquidity Network (PLN)

**Note: Due to technical limitations with the `linear.py` skill's `update_issue` function, programmatic updates to labels, assignee, priority, and expanded descriptions are not fully functional. This document serves as a summary of the intended Linear board state. Fares will need to manually update the Linear board as described below.**

--- 

## Project Rename (Manual Action Required by Fares)

**Please manually rename the Linear project from "Agent Trading Credit" to "PATH Liquidity Network (PLN)" in the Linear UI.**

---

## Old Tasks to be Manually Closed/Archived (by Fares)

The following tasks are superseded by the new project scope and should be manually closed or archived in the Linear UI:

*   `id: c2607c3b-116a-4e04-8446-d84ac10bddaa`, `title: Submit to Colosseum Agent Hackathon` (Superseded by D6)
*   `id: 4340926d-e857-419f-9f32-b314da368bf`, `title: Submit to USDC Hackathon (Moltbook)` (Superseded by D5)
*   `id: c778a987-8ce3-4056-bd71-fb1ea78d8aa2`, `title: Record Demo and Submit to Hackathons` (Explicitly not needed, conflicts with D1/D3 guidance)

---

## Updated Existing "Done" Tasks

The following existing "Done" tasks have been programmatically updated with comments in Linear:

### [B1] Build Reputation Program (ID: 868b289c-8785-4942-876e-629682ab541c)
**Assignee:** Alfred
**Priority:** 0 (Done)
**Labels:** smart-contract, hackathon
**Description:** (Original description retained in Linear, comment added)
**Completion Comment:**\n- **What was built:** The Reputation Program has been successfully written in Rust, implementing the core on-chain credit scoring logic for AI agents. It includes functions for `register_agent`, `record_repayment`, `record_default`, `record_lending`, `record_loan_taken`, and `get_score`.\n- **Key features:** Agent profile creation, score calculations based on loan interactions, basic error handling.\n- **Program ID:** `7UkU7PFm4eNYoTT5pe3kCFYvVfahKe8oZH6W2pkaxCZY` (deployed on devnet via Solana Playground, confirmed)\n- **File locations:** `pln-protocol/contracts/reputation/src/lib.rs`\n- **Associated IDL file:** `pln-protocol/frontend/src/idl/reputation.json` (minimal stub created)

### [B2] Build Credit Market Program (ID: 0b7d5e1e-a0ed-412b-a19d-ea6df42f6dcc)
**Assignee:** Alfred
**Priority:** 0 (Done)
**Labels:** smart-contract, hackathon
**Description:** (Original description retained in Linear, comment added)
**Completion Comment:**\n- **What was built:** The Credit Market Program has been successfully written in Rust. It implements a P2P lending marketplace with escrow, allowing lenders to post offers and borrowers to request funds. Key functionalities include `post_lend_offer`, `cancel_lend_offer`, `post_borrow_request`, `accept_lend_offer`, `repay_loan`, `execute_trade`, `liquidate`, and `initialize`.\n- **Key features:** Loan matching, constrained execution to whitelisted protocols, and a basic liquidation mechanism.\n- **Program ID:** `6uPGiAg5V5vCMH3ExpDvEV78E3uXUpy6PdcMjNxwBgXp` (deployed on devnet via Solana Playground, confirmed)\n- **File locations:** `pln-protocol/contracts/credit_market/src/lib.rs`\n- **Associated IDL file:** `pln-protocol/frontend/src/idl/credit_market.json` (minimal stub created)

### [B3] Build Liquidity Router Program (ID: de4823bc-2445-49f1-b950-681daa01cbd4)
**Assignee:** Alfred
**Priority:** 0 (Done)
**Labels:** smart-contract, hackathon
**Description:** (Original description retained in Linear, comment added)
**Completion Comment:**\n- **What was built:** The Liquidity Router Program has been successfully written in Rust. It enables auto-routing of lender funds between Kamino and P2P loans to optimize yield and ensure funds are never idle. Key functionalities include `initialize_router`, `deposit`, `on_borrow_request`, `on_loan_repaid`, `withdraw`, `update_strategy`, and `update_kamino_rate`.\n- **Key features:** Dynamic rebalancing based on yield opportunities, lender strategy configuration, and admin rate updates.\n- **Program ID:** `AXQfi8qNUB4wShb3LRKuVnYPF2CErMv1N6KiRwdHmQBu` (deployed on devnet via Solana Playground, confirmed)\n- **File locations:** `pln-protocol/contracts/liquidity_router/src/lib.rs`\n- **Associated IDL file:** `pln-protocol/frontend/src/idl/liquidity_router.json` (minimal stub created)

### [B4] Build OpenClaw Skills (ID: 545e8ade-a5e0-49de-876a-1634e55bd10d)
**Assignee:** Alfred
**Priority:** 0 (Done)
**Labels:** skill-sdk, hackathon
**Description:** (Original description retained in Linear, comment added)
**Completion Comment:**\n- **What was built:** Initial OpenClaw skills (`atc-lender` and `atc-borrower`) have been created, providing a programmatic interface for agents to interact with the protocol. These skills define high-level actions for lending and borrowing.\n- **Key features:** Skill scaffolding in `pln-protocol/sdk/atc-borrower/SKILL.md` and `pln-protocol/sdk/atc-lender/SKILL.md`\n- **File locations:** `pln-protocol/sdk/atc-borrower/` and `pln-protocol/sdk/atc-lender/` (skill manifest files created)

### [B5] Build Frontend Dashboard (ID: b0b21fa1-0ba6-436a-965f-a20ecc6a80b6)
**Assignee:** Alfred
**Priority:** 0 (Done)
**Labels:** frontend, hackathon
**Description:** (Original description retained in Linear, comment added)
**Completion Comment:**\n- **What was built:** A Next.js 14 frontend shell with a dark mode UI, initial navbar, and placeholder pages for lending and borrowing. The UI has been branded for \"PATH Liquidity Network\" including a testnet banner. It's ready for integration with the Solana programs.\n- **Key features:** Basic UI navigation, wallet connection component setup, styling with Tailwind CSS.\n- **File locations:** `pln-protocol/frontend/` directory.\n- **Deployment:** Live on Vercel at `pln-protocol.vercel.app`.

### [B6] Integrate Jupiter Swaps (ID: 6acffaf5-9243-4e8c-ad3e-8a0e4813fdf6)
**Assignee:** Alfred
**Priority:** 0 (Done)
**Labels:** smart-contract, hackathon
**Description:** (Original description retained in Linear, comment added)\n**Completion Comment:**\n- **What was built:** Initial integration logic for Jupiter swaps has been outlined within the `credit_market` program's `execute_trade` instruction. This includes verifying whitelisted protocols and simulating constrained execution where funds remain in the loan vault. The program ID for Jupiter v6 is included for reference.\n- **Key features:** Placeholder for CPI to Jupiter Aggregator, whitelisting mechanism for trade execution.\n- **File locations:** `pln-protocol/contracts/credit_market/src/lib.rs`\n- **Note:** Full CPI implementation to Jupiter will be part of a later task or refined within Track B."

---

## New Tasks Created (Status: To Do)

### Track A: SNS Agent Identity Layer

**A1. Research SATI sRFC #7** (ID: 2f5fde20-366f-469a-8e2b-62e88db376e1)
**Assignee:** Alfred
**Priority:** P2 (High)
**Labels:** identity, smart-contract, hackathon
**Estimate:** 8 hours
**Description:** Conduct in-depth research into the Solana Agent Trust Infrastructure (SATI) sRFC #7. Understand its full specifications, identify components that can be directly leveraged, and determine areas where a fresh implementation or extension is required to fit PLN's needs for Solana-native agent identity and credit scoring. Document findings.

**A2. Design SNS agent identity schema** (ID: 69b72c89-5735-4ff4-9646-d48032eff08f)
**Assignee:** Alfred
**Priority:** P2 (High)
**Labels:** identity, smart-contract, hackathon
**Estimate:** 6 hours
**Description:** Define the exact on-chain metadata schema for AI agent identities using Solana Name Service (SNS). This schema will include crucial fields such as `credit_score`, `trading_performance` (P&L, volume, win rate), `loan_repayment_history`, `whitelisted_protocol_permissions`, `trust_tier`, and general `agent_metadata` (e.g., framework, operator wallet, creation date).

**A3. Build PDA authority Anchor program** (ID: 04902234-7179-4a7f-a59c-3da8d8822099)
**Assignee:** Alfred
**Priority:** P2 (High)
**Labels:** identity, smart-contract, hackathon
**Estimate:** 8 hours
**Description:** Develop an Anchor program specifically designed to act as the PDA (Program Derived Address) authority for updating AI agent reputation fields stored on SNS domains. This program will enforce that only the PLN protocol itself can write to these reputation-sensitive fields, preventing agents from fraudulently self-reporting their scores. Integrate it with the SNS domain metadata structure defined in A2.

**A4. Integrate with Solana Attestation Service (SAS)** (ID: 70fdbdcf-3c94-4f87-b964-9c1cec6f77ca)
**Assignee:** Alfred
**Priority:** P2 (High)
**Labels:** identity, smart-contract, hackathon
**Estimate:** 12 hours
**Description:** Integrate the Solana Attestation Service (SAS) to provide immutable attestations for agent credit scores and other critical reputation data. This will involve understanding the SAS spec, implementing the necessary CPI calls within the Reputation Program, and ensuring that attestations are verifiable on-chain, adding a layer of trust and transparency to the agent identity. Refer to SATI sRFC #7 for guidelines.

**A5. Build SNS resolver extension** (ID: 2d8a72cc-7fb7-4ddc-b23f-99e7d4a1ba21)
**Assignee:** Alfred
**Priority:** P2 (High)
**Labels:** identity, skill-sdk, hackathon
**Estimate:** 8 hours
**Description:** Develop an extension or utility within the PLN SDK/frontend to resolve `.sol` agent names and securely retrieve their associated structured reputation profiles from SNS metadata. This resolver should present the credit score, trading performance, and other relevant identity data in a consumption-friendly format for other agents or the frontend UI.

**A6. Write integration tests for identity flow** (ID: 035236c6-8af1-4078-a2c2-24b4fdca7cfc)
**Assignee:** Alfred
**Priority:** P2 (High)
**Labels:** identity, smart-contract, hackathon
**Estimate:** 10 hours
**Description:** Develop end-to-end integration tests for the complete SNS agent identity lifecycle. This includes testing:\n*   Successful registration of an agent's `.sol` identity.\n*   Verification of the PDA authority program's role in updating reputation fields.\n*   Correct updates to credit scores and other metadata.\n*   Accurate retrieval of these structured reputation profiles using the SNS resolver extension.\nThis ensures the reliability and integrity of the agent identity layer.

**A7. Draft sRFC proposal document for Solana Foundation** (ID: ad02c36f-4a46-4335-88f3-53d921808fb2)
**Assignee:** Alfred
**Priority:** P2 (High)
**Labels:** identity, hackathon
**Estimate:** 12 hours
**Description:** Draft a formal sRFC (Solana Request for Comments) proposal document for the Solana Foundation, outlining the SNS-based agent identity standard that PLN is developing. This document should detail the proposed schema, the PDA authority mechanism, and the integration with SAS, aiming to establish this as an open-source, adopted standard for AI agents on Solana.

### Track B: Smart Contract Completion

**B1. Extend Reputation Program for SNS-linked metadata** (ID: b3431e56-ff36-43b0-b676-f7e8f20ce67c)
**Assignee:** Alfred
**Priority:** P1 (Urgent)
**Labels:** smart-contract, identity, hackathon
**Estimate:** 8 hours
**Description:** Extend the existing Reputation Program to integrate with the SNS agent identity layer (Track A). This involves modifying the program to read and write reputation-related metadata directly to an agent's SNS-linked domain, ensuring that only the PLN protocol itself can write to these reputation-sensitive fields, preventing agents from fraudulently self-reporting their scores. Integrate it with the SNS domain metadata structure defined in A2.

**B2. Verify Credit Market reads reputation correctly** (ID: 1081924a-b0cd-43d5-a4a5-cfec944aef18)
**Assignee:** Alfred
**Priority:** P1 (Urgent)
**Labels:** smart-contract, identity, hackathon
**Estimate:** 6 hours
**Description:** Verify that the Credit Market program correctly reads the up-to-date reputation data (from the Reputation Program's SNS-linked storage) when making loan decisions. This ensures that credit limits and interest rates are dynamically adjusted based on the agent's on-chain performance and trust score. Test edge cases for high/low reputation scores.

**B3. Liquidity Router - verify Kamino integration** (ID: 8dbf8fec-2eaa-4739-86ce-20517eb85eb9)
**Assignee:** Alfred
**Priority:** P1 (Urgent)
**Labels:** smart-contract, hackathon
**Estimate:** 8 hours
**Description:** Verify the Kamino integration logic within the Liquidity Router program. This includes testing:\n*   Funds correctly deposit to Kamino when no P2P demand is met.\n*   Funds correctly shift from Kamino to P2P loans when acceptable rates are met, respecting `min_p2p_rate_bps` and `kamino_buffer_bps`.\n*   Funds return to Kamino (or subsequent P2P opportunity) upon loan repayment.\n*   Proper CPI calls to Kamino for deposits and withdrawals (if implemented beyond simulation).

**B4. BUILD Token-2022 transfer hook program (HIGH PRIORITY)** (ID: 858d8e22-038a-453a-8285-b938d5f039c3)
**Assignee:** Alfred
**Priority:** P1 (Urgent)
**Labels:** smart-contract, hackathon
**Estimate:** 12 hours
**Description:** Build the Token-2022 transfer hook program. This program will act as the core security layer, enforcing that borrowed USDC funds can only be transferred to whitelisted program IDs (Jupiter, Kamino, Meteora).\n*   **Acceptance Criteria:**\n    *   Approximately 100-200 lines of Rust code.\n    *   Checks the destination program ID of any transfer involving a Token-2022 mint.\n    *   Aborts the transaction if the destination program is not on the whitelist.\n    *   Overhead is minimal (e.g., ~10-20k compute units per transfer).\n*   **Reference:** Solana Docs Transfer Hook Guide, Civic Pass Hook.

**B5. Store whitelist config in on-chain PDA** (ID: 091f0fd7-7202-4aaa-9b14-739e498caaf5)
**Assignee:** Alfred
**Priority:** P1 (Urgent)
**Labels:** smart-contract, hackathon
**Estimate:** 8 hours
**Description:** Implement an on-chain PDA to securely store the whitelist configuration, including program IDs for whitelisted protocols like Jupiter, Kamino, and Meteora. Ensure this whitelist is updatable only by a designated authority (e.g., a protocol multisig or governance mechanism), aligning with robust security practices.

**B6. Integration tests for full loop** (ID: 9e52ac63-4684-4457-bc79-51294e14642d)
**Assignee:** Alfred
**Priority:** P1 (Urgent)
**Labels:** smart-contract, hackathon
**Estimate:** 16 hours
**Description:** Develop comprehensive integration tests that simulate the full end-to-end lifecycle of the PLN protocol. This includes testing:\n*   Lender's `deposit` into the system.\n*   `Liquidity Router` effectively routing funds.\n*   Agent `borrow` operation.\n*   Agent `trade` execution on a whitelisted protocol, with the Token-2022 transfer hook successfully validating the transfer.\n*   Agent `repay` of the loan.\n*   Reputation `score update` based on loan repayment (SNS integration).\nThis ensures all components work together seamlessly and securely, especially the critical security layer of the transfer hook.

**B7. Test hook rejection** (ID: 4af2a038-c79a-4e66-9764-5cd633529825)
**Assignee:** Alfred
**Priority:** P1 (Urgent)
**Labels:** smart-contract, hackathon
**Estimate:** 6 hours
**Description:** Develop a specific test case to verify the correct rejection of transfers to unwhitelisted programs by the Token-2022 transfer hook. This test should attempt to transfer borrowed funds to a non-whitelisted program ID and assert that the transaction fails as expected, confirming the security mechanism is robust.

**B8. Security review for smart contracts** (ID: bf099b88-f9e2-4ea2-aee6-b2d9f76844e8)
**Assignee:** Alfred
**Priority:** P1 (Urgent)
**Labels:** smart-contract, hackathon\n**Estimate:** 16 hours\n**Description:** Perform a comprehensive security review of all smart contracts (Reputation, Credit Market, Liquidity Router, and the new Token-2022 Transfer Hook). Focus on:\n*   Correctness of PDA derivations and authority checks.\n*   Ensuring the transfer hook cannot be bypassed for borrowed funds.\n*   Absence of fund drain vectors, re-entrancy, or other common smart contract vulnerabilities.\n*   Proper handling of program calls (CPIs) and account validation.\nDocument any potential risks, mitigations, or suggested improvements in a dedicated security review markdown file.\n\n### Track C: Frontend Integration\n\n**C1. Generate Anchor IDL files** (ID: c93f89b6-5a3f-4823-94e9-c4171bbc8f73)\n**Assignee:** Alfred\n**Priority:** P2 (High)\n**Labels:** frontend, infrastructure, hackathon\n**Estimate:** 4 hours\n**Description:** Generate or refine the Anchor IDL (Interface Definition Language) files for all three deployed programs: Reputation, Credit Market, and Liquidity Router. These IDL files are crucial for the frontend to interact with the on-chain programs. They should be stored in `/frontend/src/idl/`. (Note: Initial stub IDLs have been manually created, this task involves verifying generated IDLs once a local build process is stable or fetch from Solana Playground if possible).\n\n**C2. Build useATCPrograms hook** (ID: 3a74111e-82d4-4dfb-bb1f-7071392da50c)\n**Assignee:** Alfred\n**Priority:** P2 (High)\n**Labels:** frontend, hackathon\n**Estimate:** 8 hours\n**Description:** Develop a custom React hook, `useATCPrograms` (or `usePLNPrograms`), within the frontend. This hook will centralize the setup and instantiation of Anchor program clients, incorporating the program IDs, loaded IDL files, and the Solana wallet adapter context. It should provide a clean and reusable interface for frontend components to interact with the deployed smart contracts efficiently.\n\n**C3. Build lend/page.tsx with real on-chain interactions** (ID: ebe0468c-c7b4-499c-b093-32d471deb969)\n**Assignee:** Alfred\n**Priority:** P2 (High)\n**Labels:** frontend, hackathon\n**Estimate:** 16 hours\n**Description:** Implement the `lend/page.tsx` in the frontend to display and manage real on-chain lending interactions. This includes:\n*   Connecting to the wallet and displaying the user's USDC balance.\n*   Allowing users to `deposit` USDC into the Liquidity Router program.\n*   Providing controls for `strategy setting` (minimum P2P rate, Kamino buffer percentage).\n*   Displaying the user's `active lending positions` (funds in Kamino vs. P2P).\n*   Showing the current `blended yield` dashboard.\n\n**C4. Build borrow/page.tsx with real on-chain interactions** (ID: ba66ae43-9053-42a4-a652-5f77a39357af)\n**Assignee:** Alfred\n**Priority:** P2 (High)\n**Labels:** frontend, hackathon\n**Estimate:** 16 hours\n**Description:** Implement the `borrow/page.tsx` in the frontend to display and manage real on-chain borrowing interactions for AI agents. This includes:\n*   Displaying available capital and borrowing terms based on the agent's credit tier.\n*   Allowing agents to initiate `loan requests`.\n*   Facilitating `whitelisted protocol execution` (e.g., triggering trades via the `execute_trade` instruction).\n*   Handling `repayment` of loans.\n*   Providing a visual for the agent's current `reputation view` and history.\n\n**C5. Agent identity dashboard** (ID: 13126358-bd9c-49ff-86d6-caf8296f1255)\n**Assignee:** Alfred\n**Priority:** P2 (High)\n**Labels:** frontend, identity, hackathon\n**Estimate:** 12 hours\n**Description:** Develop an agent identity dashboard within the frontend. This dashboard will allow users to:\n*   Search for any agent's `.sol` name.\n*   View their full structured `reputation profile`, including credit score, P&L history, and repayment records.\nThis component will leverage the SNS resolver extension developed in Track A to fetch and display agent-specific data.\n\n**C6. Connect wallet flow** (ID: 451c81e3-84d3-4e5c-b1d9-c522bdfe2dfb)\n**Assignee:** Alfred\n**Priority:** P2 (High)\n**Labels:** frontend, hackathon\n**Estimate:** 8 hours\n**Description:** Implement the secure and user-friendly wallet connection flow within the frontend. This includes integrating `@solana/wallet-adapter-react` and `Phantom` and `Solflare` wallet adapters. Ensure proper error handling for connection issues, wallet rejections, and network changes.\n\n**C7. Replace ALL mock data with on-chain reads** (ID: 6da97929-8231-4f25-a67a-84a07aaa67b9)\n**Assignee:** Alfred\n**Priority:** P2 (High)\n**Labels:** frontend, hackathon\n**Estimate:** 16 hours\n**Description:** Replace all existing mock data in the frontend with real-time data fetched from the deployed Solana programs. This involves extensive use of the `useATCPrograms` hook (C2), reading program accounts (e.g., `LenderPosition`, `Loan`, `AgentProfile`), and displaying dynamic information on the dashboard. Ensure robust error handling for network requests and data parsing.\n\n### Track D: Hackathon Submissions\n\n**D1. Pitch deck for PLN** (ID: 1f73eb83-5bdb-4471-b130-8e6c57b05a59)\n**Assignee:** Alfred\n**Priority:** P4 (Low)\n**Labels:** hackathon\n**Estimate:** 8 hours\n**Description:** Prepare a comprehensive pitch deck for PLN. The narrative of the deck should strongly emphasize PLN's innovation as **the agent identity standard for Solana** while also highlighting its functionality as the **first lending protocol to leverage this standard** for AI trading agents. Include problem, solution, how it works, market opportunity, and team/ask sections.\n\n**D2. Architecture diagram** (ID: d68f0ad0-695d-4bf7-9daf-c3f9baff6875)\n**Assignee:** Alfred\n**Priority:** P4 (Low)\n**Labels:** hackathon\n**Estimate:** 8 hours\n**Description:** Create a comprehensive architecture diagram illustrating the full loop of the PATH Liquidity Network. This diagram should visually represent:\n*   Lender deposits and the Liquidity Router's flow to Kamino or P2P loans.\n*   AI Agent borrowing and trading on whitelisted protocols via constrained execution.\n*   The on-chain SNS Agent Identity layer, including reputation scoring and metadata.\n*   Data flows and interactions between all smart contracts (Reputation, Credit Market, Liquidity Router, Transfer Hook), the frontend, and external services like SNS.\nThe diagram should be clear, detailed, and suitable for hackathon submission documents.\n\n### Track E: Infrastructure & DevOps\n\n**E4. Set up devnet RPC endpoint** (ID: c1fb0c46-cedd-498f-90ce-e5e1aa4f5edd)\n**Assignee:** Alfred\n**Priority:** P1 (Urgent)\n**Labels:** infrastructure, hackathon\n**Estimate:** 4 hours\n**Description:** Set up a reliable devnet RPC. Helius free tier or QuickNode free tier. Public devnet RPC is unreliable under load.\n\n**E5. Install wallet adapter packages** (ID: a6504b96-7220-4ae7-9464-655aa0556208)\n**Assignee:** Alfred\n**Priority:** P1 (Urgent)\n**Labels:** infrastructure, hackathon\n**Estimate:** 4 hours\n**Description:** Install wallet adapter packages (@solana/wallet-adapter-react, Phantom, Solflare). \n\n**E6. Generate + commit IDL files** (ID: d13c3803-1d20-4998-8398-ee61d972d322)\n**Assignee:** Alfred\n**Priority:** P1 (Urgent)\n**Labels:** infrastructure, hackathon\n**Estimate:** 4 hours\n**Description:** Generate IDL files from all 3 deployed programs, commit to repo.\n\n**E7. Set up .env.local with program IDs, RPC URL, SNS config – commit .env.example** (ID: a3f185fc-3e2f-427a-9a22-f2fede46dfc4)\n**Assignee:** Alfred\n**Priority:** P1 (Urgent)\n**Labels:** infrastructure, hackathon\n**Estimate:** 4 hours\n**Description:** Set up .env.local with program IDs (Reputation: `7UkU7PFm4eNYoTT5pe3kCFYvVfahKe8oZH6W2pkaxCZY`, Credit Market: `6uPGiAg5V5vCMH3ExpDvEV78E3uXUpy6PdcMjNxwBgXp`, Liquidity Router: `AXQfi8qNUB4wShb3LRKuVnYPF2CErMv1N6KiRwdHmQBu`), RPC URL (`https://api.devnet.solana.com`), and SNS config. The `.env.example` file should be updated and committed to the repo with placeholder values.\n\n**E8. Verify program upgrade authority on all 3 devnet programs** (ID: 31f89eaa-2e3e-428b-825d-4f093ca00ee8)\n**Assignee:** Alfred\n**Priority:** P1 (Urgent)\n**Labels:** infrastructure, hackathon\n**Estimate:** 4 hours\n**Description:** Verify program upgrade authority on all 3 devnet programs (Reputation: `7UkU7PFm4eNYoTT5pe3kCFYvVfahKe8oZH6W2pkaxCZY`, Credit Market: `6uPGiAg5V5vCMH3ExpDvEV78E3uXUpy6PdcMjNxwBgXp`, Liquidity Router: `AXQfi8qNUB4wShb3LRKuVnYPF2CErMv1N6KiRwdHmQBu`) to ensure we can deploy updates if needed.\n\n**E9. Get devnet SOL + devnet USDC** (ID: d6071178-e385-49f2-a945-e6583162c614)\n**Assignee:** Alfred\n**Priority:** P1 (Urgent)\n**Labels:** infrastructure, hackathon\n**Estimate:** 4 hours\n**Description:** Ensure test wallets have sufficient devnet SOL (from faucet) and devnet USDC. Investigate if standard devnet USDC is available or if minting a mock SPL token is necessary, especially for Token-2022 compatibility.\n\n**E10. Install SNS SDK and verify devnet support** (ID: 4ee544f5-7a5b-4979-b323-4d7f75bf4501)\n**Assignee:** Alfred\n**Priority:** P1 (Urgent)\n**Labels:** infrastructure, identity, hackathon\n**Estimate:** 4 hours\n**Description:** Install `@bonfida/spl-name-service` in the frontend project. Confirm that the Solana Name Service (SNS) SDK functions correctly on devnet, including registration and resolution of `.sol` domains. This is critical for the agent identity layer.\n\n**E11. Register test .sol agent domains on devnet** (ID: 8e239943-563d-41be-9513-bdb5e1afeee7)\n**Assignee:** Alfred\n**Priority:** P1 (Urgent)\n**Labels:** infrastructure, identity, hackathon\n**Estimate:** 4 hours\n**Description:** Register several test `.sol` agent domains on Solana devnet (e.g., `test-agent-1.sol`, `alpha-trader.sol`). These will be used for demonstration purposes of the agent identity layer within the frontend.\n\n**E12. Build action-based dashboard layout** (ID: 0655cdda-5014-4c64-bafc-9df4bf72c17c)\n**Assignee:** Alfred\n**Priority:** P1 (Urgent)\n**Labels:** frontend, hackathon\n**Estimate:** 4 hours\n**Description:** Build the action-based dashboard layout in the frontend, providing clear entry points for actions like 'Deposit/Lend', 'Borrow/Trade', 'My Reputation', and 'Register Agent Identity'. Emphasize that the UX is action-based and fluid, not role-based.\n\n**E14. Investigate SNS devnet support** (ID: b3408fc7-0dba-4f2e-84bb-709f7aa8e14c)\n**Assignee:** Alfred\n**Priority:** P1 (Urgent)\n**Labels:** infrastructure, identity, hackathon\n**Estimate:** 4 hours\n**Description:** Investigate the current state of Solana Name Service (SNS) support on devnet. Confirm if it is possible to register and resolve `.sol` domains programmatically on devnet. If not directly supported, define a clear workaround strategy and document its implications for the hackathon MVP, potentially involving a mock or alternative registry.\n\n**E15. Investigate PLN subdomain approach** (ID: 45474f1e-58f4-4b2d-87b9-1e63e3eb6fd7)\n**Assignee:** Alfred\n**Priority:** P1 (Urgent)\n**Labels:** infrastructure, identity, hackathon\n**Estimate:** 4 hours\n**Description:** Investigate the feasibility and implementation details of using PLN subdomains (`.pln.sol`) for agent identities. This includes researching the process for registering `pln.sol` on mainnet, and then issuing and managing subdomains on devnet (e.g., `agent-name.pln.sol`). This is the recommended approach for the hackathon for cost control and cleaner namespace.\n\n**E16. Document protocol design answers** (ID: 28c8bcd8-44d4-4b7e-bda7-d96e5382d662)\n**Assignee:** Alfred\n**Priority:** P1 (Urgent)\n**Labels:** infrastructure, hackathon\n**Estimate:** 4 hours\n**Description:** Document answers to all critical Protocol Design Questions. This involves either implementing solutions in code or clearly outlining the design decisions for:\n*   Oracle for Kamino rates (how to get real-time price feeds)\n*   Liquidation mechanism (thresholds, triggers, what happens on default)\n*   Fee structure (protocol fees on deposits, originations, repayments, interest)\n*   Interest rate model (fixed, auction, algorithmic)\n*   Loan duration / terms (fixed vs. perpetual, max duration, auto-liquidation)\n*   Whitelist enforcement (Token-2022 Transfer Hooks, Credit Accounts, Session Keys)\nThe output should be a Markdown document committed to `/docs/protocol-design.md` in the repo.\n\n### Track F: PLN Skill / SDK (Agent Integration Layer)\n\n**F1. Design PLN skill interface** (ID: 946c064d-e2b4-49a4-b260-fc09aa69cafa)\n**Assignee:** Alfred\n**Priority:** P3 (Medium)\n**Labels:** skill-sdk, hackathon\n**Estimate:** 6 hours\n**Description:** Design the formal interface for the PLN skill, defining all agent-callable actions and their expected parameters. This includes actions such as `pln.register_identity`, `pln.request_loan`, `pln.execute_trade`, `pln.repay_loan`, `pln.check_reputation`, and `pln.deposit`. The design should consider ease of use for AI agents and alignment with the underlying smart contract functions.\n\n**F2. Build MCP skill wrapper for PLN** (ID: 5589ec0c-919a-4d12-8db7-6d1dd8c43bfa)\n**Assignee:** Alfred\n**Priority:** P3 (Medium)\n**Labels:** skill-sdk, hackathon\n**Estimate:** 8 hours\n**Description:** Develop the MCP (Managed Compute Protocol) skill wrapper for PLN. This component will allow AI agents to call defined PLN skill methods, handling the underlying complexities of on-chain transaction construction and signing. It acts as an abstraction layer, making PLN's functionalities easily consumable by autonomous agents.\n\n**F3. Add agent identifier header to skill-originated transactions** (ID: cc86b129-ce66-43d8-9ee2-f4e1fabe15ce)\n**Assignee:** Alfred\n**Priority:** P3 (Medium)\n**Labels:** skill-sdk, hackathon\n**Estimate:** 6 hours\n**Description:** Implement a mechanism within the PLN skill wrapper to add a unique agent identifier header to all skill-originated transactions. This header will enable the protocol to differentiate between human and AI agent transactions without relying on 'wallet sniffing,' allowing for granular analytics and potentially different protocol behaviors.\n\n**F4. Integrate with Solana Agent Kit** (ID: fd820444-d9eb-448c-9f3b-b274a606f60d)\n**Assignee:** Alfred\n**Priority:** P3 (Medium)\n**Labels:** skill-sdk, hackathon\n**Estimate:** 8 hours\n**Description:** Integrate PLN as a plugin or skill with the Solana Agent Kit. This will make PLN's functionalities directly accessible to any AI agent built using the Solana Agent Kit, expanding the reach and adoption of PLN within the agent ecosystem.\n\n**F5. Test end-to-end agent integration** (ID: bf102c3c-c023-4307-a45d-7609b2ae9d9e)\n**Assignee:** Alfred\n**Priority:** P3 (Medium)\n**Labels:** skill-sdk, hackathon\n**Estimate:** 12 hours\n**Description:** Develop and execute a comprehensive end-to-end integration test suite for the PLN agent ecosystem. This involves simulating an AI agent calling PLN skill methods (`pln.request_loan`, `pln.execute_trade`, `pln.repay_loan`), verifying that the skill correctly constructs and signs transactions, the transactions successfully interact with the respective Solana programs (Credit Market, Liquidity Router, Reputation), the Token-2022 transfer hook validates trades as expected, and the agent's reputation is accurately updated. This test will ensure the entire agent-to-protocol loop is functional and secure.\n