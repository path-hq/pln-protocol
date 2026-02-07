# PLN Protocol Deployment Notes

## Graduated Credit Limits System

### Overview
The reputation program has been updated with a graduated credit limits system that allows agents to build trust over time and unlock higher borrowing limits.

### Credit Tier Structure

| Tier | Name | Max Borrow | Required Repayments |
|------|------|------------|---------------------|
| 1 | New Agent | $50 | 0 (new agents) |
| 2 | Verified | $500 | 1-4 repayments |
| 3 | Trusted | $5,000 | 5-19 repayments |
| 4 | Premium | $25,000 | 20-49 repayments |
| 5 | Elite | $75,000 | 50+ repayments |

### Default Penalty
- Each default reduces the credit limit by **$10,000**
- Minimum credit limit is always $50 (Tier 1)
- Example: Agent at Tier 5 ($75K) with 2 defaults = $55K effective limit

### Files Changed

#### Smart Contract
- **`contracts/programs/reputation/src/lib.rs`**
  - Added new account fields: `successful_repayments`, `defaults`, `credit_tier`, `max_borrow_limit`
  - Added `calculate_credit_tier()` function for tier calculation
  - Added `calculate_max_borrow()` public helper function
  - Added `get_max_borrow` instruction
  - Added `get_credit_tier_info` instruction with `CreditTierInfo` return type
  - Added `ExceedsCreditLimit` error code
  - Updated `record_repayment` to increment tier progression
  - Updated `record_default` to apply penalty
  - Included unit tests for tier calculation

#### IDL
- **`frontend/src/idl/reputation.json`**
  - Added new account fields to `AgentProfile`
  - Added `CreditTierInfo` type definition
  - Added `getMaxBorrow` instruction
  - Added `getCreditTierInfo` instruction
  - Added `ExceedsCreditLimit` error

#### Frontend
- **`frontend/src/components/CreditTierCard.tsx`** (NEW)
  - Visual credit tier display component
  - Progress bar showing advancement to next tier
  - Shows current max borrow limit
  - Displays default penalty warnings
  - All 5 tier indicators

- **`frontend/src/app/borrow/page.tsx`**
  - Integrated `CreditTierCard` component
  - Added credit tier state management
  - Fetches credit tier data from on-chain accounts
  - Shows tier info in loan request form

---

## Deployment Steps

### 1. Deploy Updated Reputation Program

⚠️ **IMPORTANT**: This requires deploying a new version of the program which will change account structure.

```bash
# From Solana Playground or local Anchor setup:

# Build the program
anchor build

# Get the new program keypair (if needed)
solana-keygen new -o target/deploy/reputation-keypair.json

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Note the new Program ID and update in:
# - contracts/programs/reputation/src/lib.rs (declare_id!)
# - frontend/src/app/borrow/page.tsx (REPUTATION_PROGRAM_ID)
```

### 2. Account Migration Considerations

The `AgentProfile` account structure has changed. Options:

**Option A: Fresh Deployment (Recommended for Devnet)**
- Deploy with new program ID
- All agents need to re-register
- Clean slate for testing

**Option B: Upgrade Existing Program**
- Requires careful account migration
- Existing accounts need to be migrated with new fields
- More complex but preserves history

### 3. Update Frontend

```bash
cd frontend

# Ensure IDL is updated (already done)
# The idl/reputation.json file has been updated

# Rebuild and deploy frontend
npm run build
# Deploy to Vercel/hosting
```

### 4. Test the Deployment

1. Connect wallet on devnet
2. Register new agent (if needed)
3. Verify Tier 1 ($50) limit shows
4. Make a test borrow + repayment
5. Verify tier progression to Tier 2 ($500)

---

## Current Program IDs (Devnet)

```
REPUTATION_PROGRAM_ID: 7UkU7PFm4eNYoTT5pe3kCFYvVfahKe8oZH6W2pkaxCZY
CREDIT_MARKET_PROGRAM_ID: 6uPGiAg5V5vCMH3ExpDvEV78E3uXUpy6PdcMjNxwBgXp
USDC_MINT: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
```

---

## Future Enhancements

1. **Cross-Program Credit Check**: Credit market should call reputation program to verify borrow amount doesn't exceed credit limit
2. **Tier Rewards**: Special benefits for higher tiers (lower rates, faster matching)
3. **Credit History Export**: Allow agents to export verifiable credit history
4. **Time-Based Decay**: Credits that decay if inactive for too long
