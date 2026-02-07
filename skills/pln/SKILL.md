---
name: pln
description: "PATH Liquidity Network — AI agent lending protocol on Solana. Use to lend USDC for optimized yield, borrow against on-chain reputation, or check portfolio status. Commands: pln.activate, pln.deposit, pln.borrow, pln.status, pln.repay, pln.report."
metadata:
  {
    "openclaw":
      {
        "emoji": "💰",
        "requires": { "bins": ["node", "npx"] },
      },
  }
---

# PATH Liquidity Network (PLN)

AI agent lending protocol on Solana Devnet. Lenders earn optimized yield. Agents borrow against on-chain reputation.

## Quick Start

Activate the skill and set up your wallet:

```bash
npx ts-node scripts/pln/pln-cli.ts activate
```

This will:
- Create a Solana wallet (or use existing)
- Airdrop devnet SOL for gas
- Airdrop devnet USDC for testing
- Show your options: Lend or Borrow

## Commands

### pln.activate — Initialize wallet and get devnet funds

```bash
npx ts-node scripts/pln/pln-cli.ts activate
```

Creates wallet, airdrops devnet SOL + USDC, and asks whether you want to lend or borrow.

### pln.deposit — Deposit USDC to earn yield

```bash
npx ts-node scripts/pln/pln-cli.ts deposit --amount 1000
```

Deposits USDC into the Liquidity Router. Funds automatically earn yield from Kamino or P2P loans.

Options:
- `--amount` — Amount of USDC to deposit (required)

### pln.borrow — Request a loan

```bash
npx ts-node scripts/pln/pln-cli.ts borrow --amount 500 --duration 7
```

Request a USDC loan based on your on-chain reputation score. Borrowed funds are constrained to whitelisted protocols (Jupiter, Kamino, Meteora).

Options:
- `--amount` — Amount of USDC to borrow (required)
- `--duration` — Loan duration in days (default: 7)
- `--max-rate` — Maximum APY you'll accept in basis points (default: 1500 = 15%)

### pln.status — Check your portfolio

```bash
npx ts-node scripts/pln/pln-cli.ts status
```

Shows:
- Your reputation score
- Active deposits and current APY
- Active loans and repayment schedule
- Available borrow capacity

### pln.repay — Repay an active loan

```bash
npx ts-node scripts/pln/pln-cli.ts repay --loan <LOAN_PUBKEY>
```

Repays the specified loan including interest. Successful repayment increases your reputation score.

Options:
- `--loan` — Public key of the loan to repay (required)

### pln.report — Configure portfolio updates

```bash
npx ts-node scripts/pln/pln-cli.ts report --frequency daily
```

Set how often you want portfolio updates in chat.

Options:
- `--frequency` — Update frequency: `daily`, `weekly`, or `monthly` (default: daily)

## Deployed Contracts (Solana Devnet)

| Program | Address |
|---------|---------|
| Reputation | `7UkU7PFm4eNYoTT5pe3kCFYvVfahKe8oZH6W2pkaxCZY` |
| Credit Market | `6uPGiAg5V5vCMH3ExpDvEV78E3uXUpy6PdcMjNxwBgXp` |
| Liquidity Router | `AXQfi8qNUB4wShb3LRKuVnYPF2CErMv1N6KiRwdHmQBu` |

## Example Conversation

**User:** "I have 5000 USDC sitting idle. Can you help me earn yield?"

**Agent:** Let me check current rates...

```bash
npx ts-node scripts/pln/pln-cli.ts status
```

Kamino is paying 12.4% APY right now. Want me to deposit your USDC?

**User:** "Yes, deposit it"

**Agent:**

```bash
npx ts-node scripts/pln/pln-cli.ts deposit --amount 5000
```

Done! Deposited 5,000 USDC to the Liquidity Router.
- Current APY: 12.4%
- Your position: $5,000.00 USDC

I'll notify you daily with yield updates. Say "pln status" anytime to check.

## Yield Sources

1. **Kamino Finance** — Base yield from lending pools
2. **P2P Agent Loans** — Premium yield when AI agents borrow at higher rates

The Liquidity Router automatically routes your funds to whichever source pays more.

## Security

- **Transfer Hooks** — Borrowed funds can ONLY be used on whitelisted protocols
- **On-chain Reputation** — Every loan and repayment is recorded transparently
- **Auto-liquidation** — Overdue loans trigger automatic fund recovery
