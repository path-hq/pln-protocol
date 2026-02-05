---
name: atc-lender
description: Agent Trading Credit - Lender skill. Deposit USDC to earn yield by lending to trading agents. Set your strategy once, earn 24/7.
metadata:
  version: "0.1.0"
  author: "Agent Trading Credit"
  tags: ["defi", "lending", "yield", "solana"]
---

# Agent Trading Credit - Lender Skill

Earn passive yield by lending USDC to AI trading agents. Funds auto-route between Kamino (passive) and P2P loans (active) for optimal returns.

## Installation

```bash
clawhub install atc-lender
```

## Quick Start

```bash
# Connect wallet and start earning
atc-lender start

# Deposit USDC
atc-lender deposit 1000

# View your position
atc-lender status
```

## Commands

### start
Initialize your lender profile and connect wallet.

```bash
atc-lender start
```

**Example:**
```
> atc-lender start
Connecting to Solana devnet...
Wallet connected: 7xK...abc
Creating lender position...
Position initialized!
Dashboard: http://localhost:3000/lend
```

---

### deposit
Deposit USDC to your lending pool.

```bash
atc-lender deposit <amount>
```

**Parameters:**
- `amount`: USDC amount to deposit (e.g., 1000)

**Example:**
```
> atc-lender deposit 1000
Depositing 1000 USDC...
Transaction: 5xY...def
Funds routed to Kamino (no active borrowers)
Current APY: 6.2%
Position updated: 1000 USDC in Kamino
```

**What happens:**
1. USDC transferred from your wallet to router vault
2. Router checks for matching borrowers
3. If none: funds go to Kamino for passive yield
4. If borrower @ better rate: auto-shift to P2P

---

### status
View your current lending position and earnings.

```bash
atc-lender status
```

**Example:**
```
> atc-lender status
Your Lending Position
━━━━━━━━━━━━━━━━━━━━━━━
Total Deposited:    10,000 USDC

Allocation:
  In Kamino:        8,500 USDC @ 6.2% APY
  In P2P Loans:     1,500 USDC @ 8.1% avg

Blended APY:        6.5%
Earned (24h):       $1.78

Active P2P Loans:
  #234: 500 USDC @ 8.5% to 9xZ...ghi (repays in 12m)
  #231: 500 USDC @ 7.8% to 4wQ...jkl (repays in 45m)
  #228: 500 USDC @ 8.0% to 2bR...mno (repays in 58m)

Routing Strategy:
  Min P2P rate:     7.0% (1.0% buffer over Kamino)
  Auto-route:       ENABLED
```

---

### set-strategy
Configure your lending strategy and risk tolerance.

```bash
atc-lender set-strategy [options]
```

**Options:**
- `--min-rate <bps>`: Minimum P2P rate to shift from Kamino (e.g., 700 = 7%)
- `--buffer <bps>`: Buffer over Kamino rate (e.g., 100 = 1%)
- `--min-reputation <score>`: Minimum borrower reputation (0-1000)
- `--auto-route <true|false>`: Enable/disable auto-routing

**Example:**
```
> atc-lender set-strategy --min-rate 800 --buffer 150 --auto-route true
Strategy updated:
  Min P2P rate:     8.0% APY
  Buffer:           1.5% over Kamino
  Auto-route:       ENABLED

New loans will only match if:
  - Borrower rate >= 8.0%
  - Borrower reputation >= 400/1000
  - Rate is 1.5% better than current Kamino APY
```

---

### withdraw
Withdraw available USDC from your position.

```bash
atc-lender withdraw <amount>
```

**Parameters:**
- `amount`: USDC amount to withdraw, or "all"

**Example:**
```
> atc-lender withdraw 500
Withdrawing 500 USDC...
Priority: Kamino funds (liquid)
  - 500 USDC from Kamino
Transaction: 8aB...mno
Withdrawal complete!

New position:
  Total: 9,500 USDC
  In Kamino: 8,000 USDC
  In P2P: 1,500 USDC
```

**Note:** Withdrawals prioritize Kamino funds (liquid). P2P funds may be queued if loans are active.

---

### history
View your lending and routing history.

```bash
atc-lender history
```

**Example:**
```
> atc-lender history
Recent Activity
━━━━━━━━━━━━━━━━━━━━━━━
2m ago   AUTO-SHIFT  500 USDC  Kamino → P2P #234 @ 8.5%
15m ago  REPAYMENT   500 USDC  P2P #225 repaid → Kamino
32m ago  DEPOSIT    5000 USDC  → Kamino (no borrowers)
1h ago   INTEREST    0.82 USDC Kamino yield accrued
```

---

## How It Works

### Auto-Routing Logic

```
When you deposit:
  IF no matching borrowers:
    → Kamino (earn passive yield)
  
  IF borrower @ 8% AND your min rate is 7%:
    → Auto-shift to P2P (earn higher yield)

When loan repays:
  IF new borrower @ good rate:
    → Roll into next P2P loan
  ELSE:
    → Back to Kamino
```

### Risk Management

- **Borrower reputation**: Only lend to agents with proven history
- **Constrained execution**: Borrowers can trade but can't withdraw
- **Liquidation**: Overdue loans can be liquidated by anyone
- **Diversification**: Funds split across multiple borrowers automatically

### Fees

- Protocol fee: 0.5% of P2P interest (Kamino yield has no fee)
- No deposit/withdrawal fees
- No hidden costs

---

## Configuration

**Environment Variables:**
- `ATC_NETWORK`: `devnet` or `mainnet` (default: devnet)
- `ATC_RPC_URL`: Custom RPC endpoint
- `ATC_WALLET_PATH`: Path to Solana keypair

---

## Support

**Dashboard:** http://localhost:3000/lend
**Docs:** https://docs.agenttrading.credit
**Discord:** https://discord.gg/atc

---

## Example Session

```bash
# Full lender workflow
atc-lender start
atc-lender deposit 5000
atc-lender set-strategy --min-rate 700 --buffer 100

# Check earnings after a day
atc-lender status

# Withdraw some profits
atc-lender withdraw 100

# View history
atc-lender history
```

---

**Built for:** Colosseum Agent Hackathon  
**Protocol:** Agent Trading Credit v0.1.0  
**Chain:** Solana Devnet
