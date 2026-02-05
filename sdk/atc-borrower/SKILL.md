---
name: atc-borrower
description: Agent Trading Credit - Borrower skill. Borrow USDC to execute trades on Jupiter, Kamino, or Meteora. Build reputation, get better rates.
metadata:
  version: "0.1.0"
  author: "Agent Trading Credit"
  tags: ["defi", "trading", "borrowing", "solana"]
---

# Agent Trading Credit - Borrower Skill

Borrow USDC to amplify your trading strategies. Execute trades on whitelisted protocols (Jupiter, Kamino, Meteora). Build reputation to unlock better rates and higher limits.

## Installation

```bash
clawhub install atc-borrower
```

## Quick Start

```bash
# Connect wallet and check credit
atc-borrower start

# Request a loan
atc-borrower request 500 --rate 800 --duration 1800

# Execute a trade
atc-borrower execute --loan 123 --swap SOL/USDC --amount 500

# Repay when done
atc-borrower repay --loan 123
```

## Commands

### start
Initialize your borrower profile and check credit score.

```bash
atc-borrower start
```

**Example:**
```
> atc-borrower start
Connecting to Solana devnet...
Wallet connected: 9xZ...ghi

Your Reputation
━━━━━━━━━━━━━━━━━━━━━━━
Score: 620/1000          ██████████████░░░░░░
Risk Tier: LOW

History:
  Loans taken:    12
  Loans repaid:   12
  Defaults:       0
  Total borrowed: $15,400
  Total repaid:   $15,623

Credit Limit: $5,000 (based on score)
Dashboard: http://localhost:3000/borrow
```

---

### request
Request a loan from available lenders.

```bash
atc-borrower request <amount> [options]
```

**Parameters:**
- `amount`: USDC amount to borrow (e.g., 500)

**Options:**
- `--rate <bps>`: Max interest rate you're willing to pay (e.g., 800 = 8%)
- `--duration <seconds>`: Loan duration in seconds (e.g., 1800 = 30 min)
- `--purpose <text>`: Trading purpose (e.g., "jupiter_swap", "kamino_yield")

**Example:**
```
> atc-borrower request 500 --rate 800 --duration 1800 --purpose jupiter_swap
Requesting 500 USDC...
  Max rate: 8.0% APR
  Duration: 30 minutes
  Purpose: Jupiter swap

Searching available liquidity...

✓ Match found!
Lender: 7xK...abc
Rate: 7.5% APR (within your limit)

Loan #234 created
  Principal: 500 USDC
  Interest: ~0.52 USDC (30 min @ 7.5%)
  Total due: 500.52 USDC
  Due: 17:45 UTC

Funds available in vault. Ready to trade.
```

**What happens:**
1. Router checks for lenders with matching criteria
2. If rate attractive enough, shifts funds from Kamino
3. Loan created, funds locked in vault
4. You can execute trades but cannot withdraw

---

### execute
Execute a trade using borrowed funds via whitelisted protocols.

```bash
atc-borrower execute --loan <id> [options]
```

**Required:**
- `--loan <id>`: Loan ID to use

**Options:**
- `--protocol <name>`: `jupiter`, `kamino`, or `meteora`
- `--swap <pair>`: Trading pair (e.g., "SOL/USDC")
- `--amount <usdc>`: Amount to trade
- `--direction <buy|sell>`: Trade direction

**Example:**
```
> atc-borrower execute --loan 234 --protocol jupiter --swap SOL/USDC --amount 500
Executing trade via Jupiter...

Vault Status: 500 USDC
Executing swap: 500 USDC → SOL

✓ Trade executed
  Spent: 500 USDC
  Received: 2.34 SOL
  Vault now holds: 2.34 SOL

Loan Status:
  #234: 500 USDC borrowed
  Vault: 2.34 SOL (trading position)
  Time remaining: 28m 30s
```

**Important:**
- Funds never leave the vault to your wallet
- You have trading power, not withdrawal power
- Only whitelisted protocols allowed (Jupiter, Kamino, Meteora)

---

### status
View your active loans and positions.

```bash
atc-borrower status
```

**Example:**
```
> atc-borrower status
Active Loans
━━━━━━━━━━━━━━━━━━━━━━━

Loan #234
  Amount:     500 USDC @ 7.5%
  Status:     TRADING
  Vault:      2.34 SOL (~$520)
  P&L:        +$20 (+4.0%)
  Time left:  18m 45s
  
  Actions:
    [execute]  Execute another trade
    [repay]    Close position & repay

Available Credit: $4,500 / $5,000
Next rate tier: 7.0% (at 700 score)
```

---

### repay
Repay loan and close position.

```bash
atc-borrower repay --loan <id>
```

**Required:**
- `--loan <id>`: Loan ID to repay

**Example:**
```
> atc-borrower repay --loan 234
Closing Loan #234...

Current vault: 2.34 SOL
Swapping back to USDC...
  2.34 SOL → 522 USDC

Repayment breakdown:
  Principal:    500.00 USDC
  Interest:       0.52 USDC (18m @ 7.5%)
  Protocol fee:   0.03 USDC (0.5%)
  Total due:    500.55 USDC

✓ Loan repaid
  Profit: $21.45 (after fees)
  Reputation: 620 → 640 (+20 points)

Lender received 500.52 USDC
Protocol received 0.03 USDC
You kept 21.45 USDC profit

Funds returned to Kamino for next borrower.
```

**Reputation boost:** On-time repayment increases your score by 20 points.

---

### my-reputation
View detailed reputation metrics.

```bash
atc-borrower my-reputation
```

**Example:**
```
> atc-borrower my-reputation
Detailed Reputation Report
━━━━━━━━━━━━━━━━━━━━━━━

Score: 640/1000 (GOOD)

Breakdown:
  Base score:           500
  + Repayments:        +240 (12 × 20)
  + Volume bonus:       +23 ($15k repaid)
  + Lending bonus:       +0
  - Defaults:            -0
  - Open loans:         -60 (12 × 5)
  ─────────────────────────
  Total:                640

History:
  First loan:     14 days ago
  Loans taken:    12
  Loans repaid:   12 (100%)
  Defaults:       0
  Avg loan size:  $1,283
  Total borrowed: $15,400
  Total repaid:   $15,623
  Total interest: $223
  Profit earned:  $1,847

Benefits at current score:
  ✓ Credit limit: $5,000
  ✓ Best rates: 7.0% APR
  ✓ Priority matching

Next tier (700 score):
  → Credit limit: $10,000
  → Best rates: 6.5% APR
  → Priority matching + longer durations
```

---

### list-rates
View current lending rates and liquidity.

```bash
atc-borrower list-rates
```

**Example:**
```
> atc-borrower list-rates
Current Market Rates
━━━━━━━━━━━━━━━━━━━━━━━

Instant Liquidity (Kamino):
  Available: $198,500 USDC
  Rate: 6.2% APY (passive)

P2P Lending Offers:
  Lender      Rate    Available  Min Reputation
  ─────────────────────────────────────────────
  7xK...abc   7.5%    $5,000     300
  4wQ...jkl   8.0%    $2,000     400
  2bR...mno   8.5%    $1,000     500
  
Your estimated rate: 7.0% (based on 640 score)
```

---

## How It Works

### Constrained Execution

```
Traditional Borrowing:
  Receive USDC → Do anything → Repay

ATC Borrowing:
  Funds locked in vault
  Can ONLY call: Jupiter, Kamino, Meteora
  Trade but cannot withdraw
  Profit/loss stays in vault
  Repay from vault
```

### Reputation System

```
New borrower:
  Score: 500
  Limit: $1,000
  Rate: 9%+

After 10 repaid loans:
  Score: 700
  Limit: $10,000
  Rate: 6.5%

After default:
  Score: -100
  Limit: $0
  Recovery: 5+ perfect loans
```

### Use Cases

1. **Arbitrage Bot**
   ```
   Borrow $5k → Swap on Jupiter → Price delta on CEX → 
   Swap back → Repay + profit
   ```

2. **Yield Farmer**
   ```
   Borrow $10k → Deposit in Kamino @ 9% → 
   Pay 7% interest → Keep 2% spread
   ```

3. **Leveraged Trader**
   ```
   Borrow $5k → Buy SOL → SOL up 10% → 
   Sell SOL → Repay → Keep $500 profit (minus fees)
   ```

---

## Risk Warning

⚠️ **Trading with borrowed funds is risky:**
- You must repay principal + interest regardless of trade outcome
- Liquidation possible if overdue
- Only borrow what you can afford to repay
- Start small, build reputation first

---

## Configuration

**Environment Variables:**
- `ATC_NETWORK`: `devnet` or `mainnet` (default: devnet)
- `ATC_RPC_URL`: Custom RPC endpoint
- `ATC_WALLET_PATH`: Path to Solana keypair
- `ATC_SLIPPAGE`: Max slippage for swaps (default: 1%)

---

## Support

**Dashboard:** http://localhost:3000/borrow  
**Docs:** https://docs.agenttrading.credit  
**Discord:** https://discord.gg/atc

---

## Example Trading Session

```bash
# Start and check credit
atc-borrower start

# Request $500 for 30 min @ max 8%
atc-borrower request 500 --rate 800 --duration 1800

# Check loan status
atc-borrower status

# Execute trade: buy SOL
atc-borrower execute --loan 234 --protocol jupiter --swap SOL/USDC --amount 500

# Wait for price move...

# Check P&L
atc-borrower status

# Sell SOL back to USDC
atc-borrower execute --loan 234 --protocol jupiter --swap USDC/SOL --amount 2.34

# Repay with profit
atc-borrower repay --loan 234

# Check reputation boost
atc-borrower my-reputation
```

---

**Built for:** Colosseum Agent Hackathon  
**Protocol:** Agent Trading Credit v0.1.0  
**Chain:** Solana Devnet
