---
name: pln
description: PATH Liquidity Network (PLN) Agent Skill. Comprehensive interface for AI agents to interact with the PLN protocol for lending, borrowing, trading, and reputation management.
metadata:
  version: "0.1.0"
  author: "PATH Protocol"
  tags: ["defi", "ai-agents", "lending", "borrowing", "reputation", "solana"]
---

# PATH Liquidity Network (PLN) Agent Skill

This skill provides a unified interface for AI agents to manage their financial operations within the PATH Liquidity Network. Agents can lend capital, request loans, execute trades on whitelisted protocols, manage their on-chain reputation, and register their identities.

## Installation

```bash
clawhub install pln
```

## Commands

### pln.register_identity
Register an agent's on-chain identity via Solana Name Service (SNS). This creates or updates their .sol domain with relevant metadata for reputation tracking.

```bash
pln.register_identity --agent-name <name> --metadata <json-string>
```

**Parameters:**
- `--agent-name <name>`: The desired .sol subdomain (e.g., "trader-bot.pln.sol").
- `--metadata <json-string>`: JSON string containing initial metadata like framework, operator wallet, etc. (e.g., '{"framework":"Autogen", "operator":"0x...", "version":"1.0"}'). Optional.

### pln.check_reputation
Retrieve and display the current on-chain reputation score and detailed metrics for a given agent or the calling agent.

```bash
pln.check_reputation [--agent <agent-name>]
```

**Parameters:**
- `--agent <agent-name>`: The .sol agent name to check reputation for (e.g., "trader-bot.pln.sol"). If not provided, checks the calling agent's reputation. Optional.

### pln.deposit (from atc-lender)
Deposit USDC to the agent's lending pool within the PLN. Funds will be auto-routed for optimal yield.

```bash
pln.deposit <amount>
```

**Parameters:**
- `amount`: USDC amount to deposit (e.g., 1000).

### pln.set_lending_strategy (from atc-lender)
Configure the agent's lending strategy and risk tolerance.

```bash
pln.set_lending_strategy [--min-rate <bps>] [--buffer <bps>] [--min-reputation <score>] [--auto-route <true|false>]
```

**Options:**
- `--min-rate <bps>`: Minimum P2P rate to shift from Kamino (e.g., 700 = 7%).
- `--buffer <bps>`: Buffer over Kamino rate (e.g., 100 = 1%).
- `--min-reputation <score>`: Minimum borrower reputation required (0-1000).
- `--auto-route <true|false>`: Enable/disable auto-routing to P2P loans.

### pln.request_loan (from atc-borrower)
Request a loan from available lenders in the PLN.

```bash
pln.request_loan <amount> [--rate <bps>] [--duration <seconds>] [--purpose <text>]
```

**Parameters:**
- `amount`: USDC amount to borrow (e.g., 500).

**Options:**
- `--rate <bps>`: Max interest rate willing to pay (e.g., 800 = 8% APR).
- `--duration <seconds>`: Loan duration in seconds (e.g., 1800 = 30 min).
- `--purpose <text>`: Trading purpose (e.g., "jupiter_swap", "kamino_yield").

### pln.execute_trade (from atc-borrower)
Execute a trade using borrowed funds via whitelisted protocols. Funds are locked in a vault during execution.

```bash
pln.execute_trade --loan <id> --protocol <name> --swap <pair> --amount <value> [--direction <buy|sell>]
```

**Required:**
- `--loan <id>`: Loan ID to use.
- `--protocol <name>`: `jupiter`, `kamino`, or `meteora`.
- `--swap <pair>`: Trading pair (e.g., "SOL/USDC").
- `--amount <value>`: Amount to trade in base currency.

**Options:**
- `--direction <buy|sell>`: Trade direction (e.g., "buy", "sell").

### pln.repay_loan (from atc-borrower)
Repay an active loan and close the position.

```bash
pln.repay_loan --loan <id>
```

**Required:**
- `--loan <id>`: Loan ID to repay.

### pln.withdraw (from atc-lender)
Withdraw available USDC from the agent's lending position.

```bash
pln.withdraw <amount>
```

**Parameters:**
- `amount`: USDC amount to withdraw, or "all".
