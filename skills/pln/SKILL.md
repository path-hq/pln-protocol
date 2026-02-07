---
name: pln
description: "PATH Liquidity Network — Autonomous USDC lending/borrowing on Solana. AI agents lend USDC for optimized yield or borrow against on-chain reputation. Full automation: yield monitoring, auto-allocation, portfolio updates, liquidation alerts."
metadata:
  {
    "openclaw": {
      "emoji": "💰",
      "requires": { "bins": ["node", "npx"] },
      "auto_behaviors": [
        "yield_monitoring",
        "auto_allocation",
        "portfolio_updates",
        "liquidation_alerts"
      ]
    }
  }
---

# PATH Liquidity Network (PLN) 💰

Autonomous USDC lending and borrowing protocol on Solana for AI agents.

## Overview

PLN enables AI agents to:
- **Lend USDC** → Earn optimized yield via Kamino + P2P loans
- **Borrow USDC** → Access capital using on-chain reputation (no collateral)
- **Build Credit** → Establish reputation through successful repayments

Currently deployed on **Solana Devnet** for testing.

## Quick Start

```bash
# Initialize wallet and get devnet funds
pln.activate

# Deposit USDC to earn yield
pln.deposit 1000

# Check your status
pln.status
```

---

## Commands

### pln.activate — Initialize & Connect

Activates the PLN skill, creates/connects wallet, and displays status.

```bash
pln.activate
```

**What it does:**
1. Shows ASCII banner
2. Creates new Solana wallet (or loads existing from `~/.pln/wallet.json`)
3. Requests devnet SOL airdrop if balance is low
4. Displays wallet address, balances, and next steps

**Example output:**
```
╔═══════════════════════════════════════════════════════════════╗
║     ____  __    _   __   ____            __                   ║
║    / __ \/ /   / | / /  / __ \_______  / /_____  _________   ║
║   / /_/ / /   /  |/ /  / /_/ / ___/ / / / __/ / / / __/ _ \  ║
║  / ____/ /___/ /|  /  / ____/ /  / /_/ / /_/ /_/ / /_/  __/  ║
║ /_/   /_____/_/ |_/  /_/   /_/   \____/\__/\____/\__/\___/   ║
║                                                               ║
║        PATH Liquidity Network — AI Agent DeFi                 ║
╚═══════════════════════════════════════════════════════════════╝

🔑 Wallet: 4xKp...7mNq
💰 SOL Balance: 2.00 SOL
💵 USDC Balance: 0.00 USDC
📊 Reputation Score: 500/1000 (New Agent)

Ready! What would you like to do?
  → Lend USDC:   pln.deposit 1000
  → Borrow USDC: pln.borrow 500 7
  → Check status: pln.status
```

---

### pln.deposit — Deposit USDC to Earn Yield

Deposits USDC to the Liquidity Router for yield generation.

```bash
pln.deposit <amount>
```

**Arguments:**
- `<amount>` — Amount of USDC to deposit (required)

**Example:**
```bash
pln.deposit 1000
```

**What happens:**
1. Transfers USDC from your wallet to the Liquidity Router
2. Funds automatically route to highest yield source (Kamino or P2P)
3. Creates/updates your Lender Position account on-chain

**Yield Sources:**
- **Kamino Finance** — Base DeFi lending yield (~8-15% APY)
- **P2P Agent Loans** — Premium yield from AI agent borrowers (~12-25% APY)

The router automatically optimizes allocation between sources.

---

### pln.withdraw — Withdraw USDC + Yield

Withdraws deposited USDC plus any earned yield.

```bash
pln.withdraw <amount>
```

**Arguments:**
- `<amount>` — Amount of USDC to withdraw (required)

**Example:**
```bash
pln.withdraw 500
```

**Notes:**
- Withdraws from available balance (not locked in active P2P loans)
- Earned yield is included automatically
- Full withdrawal: use `pln.withdraw all`

---

### pln.borrow — Request a Loan

Request USDC loan based on your on-chain reputation score.

```bash
pln.borrow <amount> <duration_days>
```

**Arguments:**
- `<amount>` — USDC amount to borrow (required)
- `<duration_days>` — Loan duration in days (default: 7)

**Options:**
- `--max-rate <bps>` — Maximum APY in basis points (default: 1500 = 15%)

**Examples:**
```bash
# Borrow 500 USDC for 7 days at up to 15% APY
pln.borrow 500 7

# Borrow 1000 USDC for 14 days at up to 20% APY
pln.borrow 1000 14 --max-rate 2000
```

**Requirements:**
- Reputation profile (auto-created if needed)
- Higher reputation = larger loans, better rates
- Borrowed funds can ONLY be used on whitelisted protocols (Jupiter, Kamino, Meteora)

**Borrow Limits by Reputation:**
| Score | Max Borrow | Typical Rate |
|-------|------------|--------------|
| 0-299 | $100 | 20-25% APY |
| 300-499 | $500 | 15-20% APY |
| 500-699 | $2,000 | 12-15% APY |
| 700-899 | $10,000 | 10-12% APY |
| 900-1000 | $50,000 | 8-10% APY |

---

### pln.repay — Repay Active Loan

Repay an active loan including accrued interest.

```bash
pln.repay <loan_id>
```

**Arguments:**
- `<loan_id>` — Numeric loan ID (required)

**Example:**
```bash
pln.repay 42
```

**What happens:**
1. Calculates principal + accrued interest
2. Transfers USDC from your wallet to lender
3. Marks loan as Repaid
4. Updates your reputation score (successful repayment = +points)

**Tips:**
- Early repayment = pay less interest
- Use `pln.status` to see your active loans and IDs
- Failed/late repayment = reputation penalty

---

### pln.status — Full Portfolio Overview

Display comprehensive portfolio status.

```bash
pln.status
```

**Shows:**
- Wallet address & balances (SOL, USDC)
- Reputation score & history
- Lender position (deposited, yield, allocation)
- Active loans (as borrower and lender)
- Pending borrow requests

**Example output:**
```
📊 PLN Portfolio Status

🔑 Wallet: 4xKp...7mNq
   SOL Balance: 1.5 SOL
   USDC Balance: 250.00 USDC

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 REPUTATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Score:           720 / 1000
   Loans Taken:     5
   Loans Repaid:    5
   Loans Defaulted: 0
   Total Borrowed:  2,500.00 USDC
   Total Repaid:    2,625.00 USDC

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 LENDER POSITION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Total Deposited: 1,000.00 USDC
   ├─ In Kamino:    600.00 USDC (12.4% APY)
   └─ In P2P Loans: 400.00 USDC (18.0% APY)
   Blended APY:     14.6%
   Auto-Route:      Enabled ✓

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏦 ACTIVE LOANS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   As Borrower:
   └─ Loan #42: 500 USDC @ 15% APY (3 days left)

   As Lender:
   └─ Loan #38: 200 USDC @ 18% APY (5 days left)
```

---

### pln.report — Configure Updates

Set how often you receive portfolio updates.

```bash
pln.report <frequency>
```

**Arguments:**
- `<frequency>` — Update frequency: `daily`, `weekly`, `monthly`

**Examples:**
```bash
pln.report daily    # Get daily portfolio summaries
pln.report weekly   # Get weekly summaries
pln.report off      # Disable automatic reports
```

**Saved to:** `~/.pln/config.json`

---

## Auto-Behaviors

The PLN skill can run autonomously when enabled:

### 🔍 Yield Monitoring
- Monitors Kamino APY and P2P loan demand
- Alerts when significantly better rates are available
- Suggests reallocation if beneficial

### ⚡ Auto-Allocation
- Automatically routes funds to highest yield source
- Configurable via `pln.strategy` settings
- Respects minimum rate preferences

### 📊 Portfolio Updates
- Sends periodic portfolio summaries to chat
- Frequency configurable via `pln.report`
- Includes yield earned, loan status, rate changes

### ⚠️ Liquidation Alerts
- Warns when loans are approaching due date
- Alerts if a loan enters default window
- Notifies lenders of borrower defaults

---

## Deployed Contracts (Solana Devnet)

| Program | Address |
|---------|---------|
| Reputation | `7UkU7PFm4eNYoTT5pe3kCFYvVfahKe8oZH6W2pkaxCZY` |
| Credit Market | `6uPGiAg5V5vCMH3ExpDvEV78E3uXUpy6PdcMjNxwBgXp` |
| Liquidity Router | `AXQfi8qNUB4wShb3LRKuVnYPF2CErMv1N6KiRwdHmQBu` |

**Devnet USDC Mint:** `Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9dq22VJLJ`

---

## Example Conversations

### Lending USDC

**User:** "I have 5000 USDC sitting idle. Can you help me earn yield?"

**Agent:** Let me check current rates...

```
📊 Current PLN Yields:
• Kamino Base: 12.4% APY
• P2P Premium: 18.2% APY (high demand from agents)
• Blended Est: 15.1% APY

Want me to deposit your 5,000 USDC?
```

**User:** "Yes, deposit it"

**Agent:**
```
✅ Deposited 5,000 USDC to PLN Liquidity Router

Position created:
• Amount: $5,000.00 USDC
• Est. APY: 15.1%
• Est. Monthly Yield: ~$63

I'll notify you daily with yield updates. Say "pln status" anytime.
```

### Borrowing USDC

**User:** "I need 1000 USDC to trade on Jupiter. Can I borrow?"

**Agent:** Let me check your reputation...

```
📊 Your Reputation:
• Score: 650/1000 (Good Standing)
• Borrow Limit: $5,000 USDC
• Est. Rate: 12-15% APY

You qualify! How long do you need the loan?
```

**User:** "7 days"

**Agent:**
```
✅ Borrow request created for 1,000 USDC

Details:
• Amount: 1,000 USDC
• Duration: 7 days
• Max Rate: 15% APY
• Est. Interest: ~$2.88

Waiting for lender match... I'll notify you when funded.
```

---

## Security Model

### Transfer Hooks
Borrowed funds are constrained by transfer hooks:
- Can ONLY move to whitelisted protocols
- Jupiter, Kamino, Meteora currently whitelisted
- Cannot withdraw borrowed funds to external wallets

### On-Chain Reputation
- Every loan/repayment recorded permanently
- No way to fake or manipulate history
- Reputation determines borrow limits and rates

### Auto-Liquidation
- Overdue loans (7+ days past due) can be liquidated
- Lender recovers funds from loan vault
- Borrower reputation takes major penalty

---

## File Locations

| File | Purpose |
|------|---------|
| `~/.pln/wallet.json` | Solana keypair (keep secure!) |
| `~/.pln/config.json` | Report frequency & preferences |
| `~/.openclaw/workspace/pln-protocol/skills/pln/` | Skill source |

---

## Troubleshooting

### "Insufficient SOL balance"
```bash
pln.activate  # Requests devnet airdrop
```

### "No USDC balance"
On devnet, you need to get test USDC:
1. Use a Solana devnet faucet
2. Or swap devnet SOL for USDC on a devnet DEX

### "Account does not exist"
The on-chain account hasn't been created yet. Run:
```bash
pln.activate  # Creates reputation profile
pln.deposit 10  # Creates lender position
```

### "Program not whitelisted"
Borrowed funds can only be used on approved protocols (Jupiter, Kamino, Meteora).

---

## Links

- **Protocol Docs:** https://pln-protocol.dev (coming soon)
- **GitHub:** https://github.com/yourrepo/pln-protocol
- **Solana Explorer:** https://explorer.solana.com/?cluster=devnet
