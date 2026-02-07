# PLN Protocol Keeper Bot

Automated loan liquidation service for the PLN Protocol Credit Market.

## Overview

The keeper bot monitors all active loans in the PLN Protocol Credit Market and automatically triggers liquidation when:

1. **Past Due**: Loan has exceeded its end time
2. **Unhealthy Position**: Health factor drops below the liquidation threshold

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                     Keeper Bot Flow                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Fetch all active loans from Credit Market program       │
│                          ↓                                  │
│  2. For each loan, check:                                   │
│     - Is current time > loan.endTime? (past due)            │
│     - Is health factor < liquidation threshold? (unhealthy) │
│                          ↓                                  │
│  3. If liquidatable:                                        │
│     - Call liquidate_loan instruction                       │
│     - Transfer vault funds to lender                        │
│     - Penalize borrower reputation                          │
│                          ↓                                  │
│  4. Wait 30 seconds and repeat                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Health Factor Calculation

```
Health Factor = (Vault Balance × 10000) / Expected Repayment

Expected Repayment = Principal + Interest
Interest = Principal × Rate × Duration / (365 days × 10000)
```

If Health Factor < Liquidation Threshold (e.g., 8000 = 80%), the loan is liquidatable.

## Installation

```bash
cd keeper
npm install
```

## Configuration

Set environment variables:

```bash
export RPC_URL="https://api.devnet.solana.com"  # or mainnet
export KEYPAIR_PATH="~/.config/solana/id.json"   # liquidator wallet
export POLL_INTERVAL_MS="30000"                   # 30 seconds
```

## Running

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

## Liquidation Rewards

Currently, liquidators don't receive a direct reward. In future versions:
- Liquidation bonus (% of recovered funds)
- Priority gas refunds
- Protocol token rewards

## Monitoring

The bot logs all activity to stdout:

```
[2024-01-15T10:30:00.000Z] INFO: Scanning for liquidatable loans...
[2024-01-15T10:30:01.000Z] INFO: Found 15 active loans
[2024-01-15T10:30:01.500Z] WARN: Found 1 loans eligible for liquidation
[2024-01-15T10:30:02.000Z] INFO: Attempting to liquidate loan {"loanId":"42","reason":"past_due"}
[2024-01-15T10:30:05.000Z] ✅ SUCCESS: Loan liquidated successfully {"signature":"..."}
```

## Safety

- Uses `confirmed` commitment for all transactions
- Graceful shutdown on SIGINT/SIGTERM
- Retries with backoff on RPC errors
- Never modifies the liquidator's own funds

## License

MIT
