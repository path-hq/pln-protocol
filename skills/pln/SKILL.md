---
name: pln
description: "PLN — PATH Liquidity Network. Agent-native credit layer built on Kamino's infrastructure. Deposit USDC for optimized yield. Borrow against on-chain reputation."
metadata:
  {
    "openclaw": {
      "emoji": "💰",
      "requires": { "bins": ["node", "npx"] },
      "auto_behaviors": [
        "kamino_yield_routing",
        "p2p_loan_matching",
        "auto_rebalancing",
        "portfolio_updates",
        "liquidation_alerts"
      ]
    }
  }
---

# PLN — PATH Liquidity Network

Agent-native credit layer built on Kamino's infrastructure.
Deposit USDC for optimized yield. Borrow against on-chain reputation.

## Commands

- **pln.activate** — Create wallet, connect to Solana devnet, choose strategy
- **pln.deposit \<amount\>** — Deposit USDC (routes to Kamino + P2P automatically)
- **pln.withdraw \<amount\>** — Withdraw USDC + earned yield
- **pln.borrow \<amount\> \<duration\>** — Request loan (credit limit based on reputation)
- **pln.repay \<loan_id\>** — Repay active loan + interest
- **pln.status** — Portfolio: positions, P&L, reputation, credit tier, allocation
- **pln.report \<daily|weekly|monthly\>** — Configure update frequency

## Auto-behaviors

- Routes idle funds to Kamino vaults for base yield (~8% APY)
- Monitors P2P loan demand — auto-routes to higher-yield loans when available
- Auto-rebalances between Kamino and P2P based on rate differential
- Sends portfolio updates via configured channel
- Auto-repays loans before expiry when profitable
- Reports blended APY: Kamino base + P2P premium

## Risk Protection (5 Layers)

1. **Transfer hooks** — borrowed funds constrained to Jupiter + Kamino only
2. **Graduated credit limits** — $50 → $500 → $5K → $25K → $75K
3. **Position monitoring** — auto-liquidate at 80% health threshold
4. **Insurance pool** — 10% of interest covers lender losses on default
5. **Diversification** — max 10% exposure per borrower

## Built on Kamino

PLN uses Kamino's institutional-grade lending infrastructure as its base yield layer.
Idle funds earn Kamino vault yields. When agent demand exceeds Kamino rates,
capital routes to higher-APY P2P loans secured by on-chain reputation and transfer hooks.
Kamino handles DeFi plumbing. PLN handles agent identity and credit.

---

## Quick Start

```bash
# Initialize wallet and choose your strategy
pln.activate

# Deposit USDC to earn yield
pln.deposit 1000

# Check your portfolio
pln.status
```

---

## Command Details

### pln.activate — Initialize & Choose Strategy

Activates the PLN skill, creates/connects wallet, and lets you choose a strategy.

```bash
pln.activate
```

**What it does:**
1. Shows ASCII banner
2. Creates new Solana wallet (or loads existing from `~/.pln/wallet.json`)
3. Requests devnet SOL airdrop if balance is low
4. Prompts strategy selection:
   - **Yield Optimizer** — Maximize returns, auto-route between Kamino & P2P
   - **Trading Agent** — Borrow to execute strategies on Jupiter/Kamino

**Example output:**
```
╔═══════════════════════════════════════════════════════════════╗
║     ____  __    _   __   ____            __                   ║
║    / __ \/ /   / | / /  / __ \_______  / /_____  _________   ║
║   / /_/ / /   /  |/ /  / /_/ / ___/ / / / __/ / / / __/ _ \  ║
║  / ____/ /___/ /|  /  / ____/ /  / /_/ / /_/ /_/ / /_/  __/  ║
║ /_/   /_____/_/ |_/  /_/   /_/   \____/\__/\____/\__/\___/   ║
║                                                               ║
║        PATH Liquidity Network — Built on Kamino               ║
╚═══════════════════════════════════════════════════════════════╝

🔑 Wallet: 4xKp...7mNq
💰 SOL Balance: 2.00 SOL
💵 USDC Balance: 0.00 USDC
📊 Reputation Score: 500/1000 (New Agent)

Choose your strategy:
  [1] Yield Optimizer — Lend USDC, earn Kamino + P2P yields
  [2] Trading Agent — Borrow against reputation, trade on Jupiter

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
- **Kamino Finance** — Base DeFi lending yield (~8% APY)
- **P2P Agent Loans** — Premium yield from AI agent borrowers (~12-25% APY)

The router automatically optimizes allocation between sources based on rate differential.

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
pln.withdraw all
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

**Credit Tiers (Graduated Limits):**

| Tier | Score | Credit Limit | Typical Rate |
|------|-------|--------------|--------------|
| Newcomer | 0-299 | $50 | 20-25% APY |
| Building | 300-499 | $500 | 15-20% APY |
| Established | 500-699 | $5,000 | 12-15% APY |
| Trusted | 700-899 | $25,000 | 10-12% APY |
| Elite | 900-1000 | $75,000 | 8-10% APY |

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

Display comprehensive portfolio status with Kamino vs P2P yield breakdown.

```bash
pln.status
```

**Shows:**
- Wallet address & balances (SOL, USDC)
- Reputation score, credit tier, & history
- Lender position with **Kamino yield vs P2P yield breakdown**
- Active loans (as borrower and lender)
- Pending borrow requests
- Blended APY calculation

**Example output:**
```
📊 PLN Portfolio Status

🔑 Wallet: 4xKp...7mNq
   SOL Balance: 1.5 SOL
   USDC Balance: 250.00 USDC

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 REPUTATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Score:           720 / 1000 (Trusted)
   Credit Limit:    $25,000
   Loans Taken:     5
   Loans Repaid:    5
   Loans Defaulted: 0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 LENDER POSITION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Total Deposited: 1,000.00 USDC
   
   🏦 Kamino Yield:
   └─ 600.00 USDC @ 8.2% APY
   
   🤝 P2P Yield:
   └─ 400.00 USDC @ 18.0% APY
   
   📊 Blended APY: 12.1%
   Auto-Route: Enabled ✓

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
- `<frequency>` — Update frequency: `daily`, `weekly`, `monthly`, `off`

**Examples:**
```bash
pln.report daily    # Get daily portfolio summaries
pln.report weekly   # Get weekly summaries
pln.report off      # Disable automatic reports
```

---

## Example Conversations

### Yield Optimizer Strategy

**User:** "I have 5000 USDC sitting idle. Can you help me earn yield?"

**Agent:** Let me check current rates...

```
📊 Current PLN Yields:
• Kamino Base:   8.2% APY (guaranteed DeFi yield)
• P2P Premium:   18.2% APY (high demand from agents)
• Blended Est:   12.1% APY

Want me to deposit your 5,000 USDC?
```

**User:** "Yes, deposit it"

**Agent:**
```
✅ Deposited 5,000 USDC to PLN Liquidity Router

Position created:
• Amount: $5,000.00 USDC
• Routing: 60% Kamino / 40% P2P (auto-optimized)
• Est. Blended APY: 12.1%
• Est. Monthly Yield: ~$50

I'll notify you daily with yield updates. Say "pln status" anytime.
```

### Trading Agent Strategy

**User:** "I need 1000 USDC to trade on Jupiter. Can I borrow?"

**Agent:** Let me check your reputation...

```
📊 Your Reputation:
• Score: 650/1000 (Established)
• Credit Limit: $5,000 USDC
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
• Constraint: Jupiter + Kamino only (transfer hooks)

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
- Reputation determines credit limits and rates

### Insurance Pool
- 10% of interest fees go to insurance pool
- Covers lender losses on borrower defaults
- Distributed proportionally to affected lenders

### Auto-Liquidation
- Overdue loans (7+ days past due) can be liquidated
- Position health monitored at 80% threshold
- Lender recovers funds from loan vault
- Borrower reputation takes major penalty

---

## Deployed Contracts (Solana Devnet)

| Program | Address |
|---------|---------|
| Reputation | `7UkU7PFm4eNYoTT5pe3kCFYvVfahKe8oZH6W2pkaxCZY` |
| Credit Market | `6uPGiAg5V5vCMH3ExpDvEV78E3uXUpy6PdcMjNxwBgXp` |
| Liquidity Router | `AXQfi8qNUB4wShb3LRKuVnYPF2CErMv1N6KiRwdHmQBu` |

**Devnet USDC Mint:** `Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9dq22VJLJ`

---

## File Locations

| File | Purpose |
|------|---------|
| `~/.pln/wallet.json` | Solana keypair (keep secure!) |
| `~/.pln/config.json` | Report frequency, strategy & preferences |
| `~/.openclaw/workspace/pln-protocol/skills/pln/` | Skill source |

---

## Links

- **Protocol Docs:** https://pln-protocol.dev (coming soon)
- **Kamino Finance:** https://kamino.finance
- **GitHub:** https://github.com/yourrepo/pln-protocol
- **Solana Explorer:** https://explorer.solana.com/?cluster=devnet
