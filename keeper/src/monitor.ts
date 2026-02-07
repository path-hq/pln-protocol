/**
 * PLN Protocol Keeper Bot
 * Monitors active loans and triggers liquidation for past-due or unhealthy positions
 * 
 * Run: npx ts-node monitor.ts
 * Environment variables:
 *   - RPC_URL: Solana RPC endpoint (default: devnet)
 *   - KEYPAIR_PATH: Path to liquidator keypair (default: ~/.config/solana/id.json)
 *   - POLL_INTERVAL_MS: Monitoring interval in ms (default: 30000)
 */

import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  Program,
  AnchorProvider,
  Wallet,
  BN,
  IdlAccounts,
} from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Configuration
// ============================================================================

const RPC_URL = process.env.RPC_URL || 'https://api.devnet.solana.com';
const KEYPAIR_PATH = process.env.KEYPAIR_PATH || `${process.env.HOME}/.config/solana/id.json`;
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || '30000');
const CREDIT_MARKET_PROGRAM_ID = new PublicKey('CRDTmk5GYLqSh8fPGvdMgdmAHxYhAuP5YzJfDL8W9Xyz');
const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'); // Devnet USDC

// ============================================================================
// Types
// ============================================================================

interface LoanAccount {
  publicKey: PublicKey;
  account: {
    id: BN;
    lender: PublicKey;
    borrower: PublicKey;
    principal: BN;
    rateBps: number;
    startTime: BN;
    endTime: BN;
    status: { active?: {} } | { repaid?: {} } | { defaulted?: {} } | { liquidated?: {} } | { open?: {} };
    vault: PublicKey;
    liquidationThresholdBps: number;
    bump: number;
  };
}

interface LiquidationCandidate {
  loan: LoanAccount;
  reason: 'past_due' | 'unhealthy';
  healthFactorBps?: number;
  secondsOverdue?: number;
}

// ============================================================================
// Logger
// ============================================================================

const logger = {
  info: (msg: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] INFO: ${msg}`, data ? JSON.stringify(data) : '');
  },
  warn: (msg: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] WARN: ${msg}`, data ? JSON.stringify(data) : '');
  },
  error: (msg: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ERROR: ${msg}`, data ? JSON.stringify(data) : '');
  },
  success: (msg: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ✅ SUCCESS: ${msg}`, data ? JSON.stringify(data) : '');
  },
};

// ============================================================================
// Keeper Bot Class
// ============================================================================

class KeeperBot {
  private connection: Connection;
  private wallet: Wallet;
  private provider: AnchorProvider;
  private liquidatorKeypair: Keypair;

  constructor() {
    // Load liquidator keypair
    const keypairData = JSON.parse(fs.readFileSync(KEYPAIR_PATH, 'utf-8'));
    this.liquidatorKeypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
    
    // Setup connection and provider
    this.connection = new Connection(RPC_URL, 'confirmed');
    this.wallet = new Wallet(this.liquidatorKeypair);
    this.provider = new AnchorProvider(this.connection, this.wallet, {
      commitment: 'confirmed',
    });
  }

  /**
   * Fetch all active loans from the credit market program
   */
  async fetchActiveLoans(): Promise<LoanAccount[]> {
    try {
      // Fetch all Loan accounts using getProgramAccounts
      const accounts = await this.connection.getProgramAccounts(CREDIT_MARKET_PROGRAM_ID, {
        filters: [
          // Filter for Loan account discriminator (first 8 bytes)
          // In a real implementation, you'd calculate this from the IDL
          { dataSize: 145 }, // Approximate size of Loan account
        ],
      });

      const loans: LoanAccount[] = [];
      
      for (const { pubkey, account } of accounts) {
        try {
          // Deserialize loan account data
          // Skip 8-byte discriminator
          const data = account.data.slice(8);
          
          const loan = this.deserializeLoan(pubkey, data);
          
          // Only include active loans
          if ('active' in loan.account.status) {
            loans.push(loan);
          }
        } catch (e) {
          // Skip accounts that don't match Loan schema
          continue;
        }
      }

      return loans;
    } catch (error) {
      logger.error('Failed to fetch active loans', { error: String(error) });
      return [];
    }
  }

  /**
   * Deserialize raw loan account data
   */
  private deserializeLoan(pubkey: PublicKey, data: Buffer): LoanAccount {
    let offset = 0;
    
    // id: u64
    const id = new BN(data.slice(offset, offset + 8), 'le');
    offset += 8;
    
    // lender: Pubkey
    const lender = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;
    
    // borrower: Pubkey
    const borrower = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;
    
    // principal: u64
    const principal = new BN(data.slice(offset, offset + 8), 'le');
    offset += 8;
    
    // rateBps: u16
    const rateBps = data.readUInt16LE(offset);
    offset += 2;
    
    // startTime: i64
    const startTime = new BN(data.slice(offset, offset + 8), 'le');
    offset += 8;
    
    // endTime: i64
    const endTime = new BN(data.slice(offset, offset + 8), 'le');
    offset += 8;
    
    // status: enum (1 byte for variant)
    const statusVariant = data[offset];
    offset += 1;
    const status = this.parseStatus(statusVariant);
    
    // vault: Pubkey
    const vault = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;
    
    // liquidationThresholdBps: u16
    const liquidationThresholdBps = data.readUInt16LE(offset);
    offset += 2;
    
    // bump: u8
    const bump = data[offset];
    
    return {
      publicKey: pubkey,
      account: {
        id,
        lender,
        borrower,
        principal,
        rateBps,
        startTime,
        endTime,
        status,
        vault,
        liquidationThresholdBps,
        bump,
      },
    };
  }

  /**
   * Parse status enum from byte
   */
  private parseStatus(variant: number): LoanAccount['account']['status'] {
    switch (variant) {
      case 0: return { open: {} };
      case 1: return { active: {} };
      case 2: return { repaid: {} };
      case 3: return { defaulted: {} };
      case 4: return { liquidated: {} };
      default: return { active: {} };
    }
  }

  /**
   * Check if a loan is liquidatable
   */
  async checkLiquidatable(loan: LoanAccount): Promise<LiquidationCandidate | null> {
    const now = Math.floor(Date.now() / 1000);
    const endTime = loan.account.endTime.toNumber();
    
    // Check if past due
    if (now > endTime) {
      return {
        loan,
        reason: 'past_due',
        secondsOverdue: now - endTime,
      };
    }
    
    // Check health factor
    try {
      const vaultBalance = await this.getVaultBalance(loan.account.vault);
      const durationSecs = now - loan.account.startTime.toNumber();
      const interest = this.calculateInterest(
        loan.account.principal.toNumber(),
        loan.account.rateBps,
        durationSecs
      );
      const expectedRepayment = loan.account.principal.toNumber() + interest;
      
      const healthFactorBps = expectedRepayment > 0
        ? Math.floor((vaultBalance * 10000) / expectedRepayment)
        : 10000;
      
      if (healthFactorBps < loan.account.liquidationThresholdBps) {
        return {
          loan,
          reason: 'unhealthy',
          healthFactorBps,
        };
      }
    } catch (error) {
      logger.warn('Failed to check health factor', { 
        loanId: loan.account.id.toString(),
        error: String(error),
      });
    }
    
    return null;
  }

  /**
   * Get token balance of a vault
   */
  async getVaultBalance(vault: PublicKey): Promise<number> {
    try {
      const accountInfo = await this.connection.getTokenAccountBalance(vault);
      return parseInt(accountInfo.value.amount);
    } catch {
      return 0;
    }
  }

  /**
   * Calculate simple interest
   */
  private calculateInterest(principal: number, rateBps: number, durationSecs: number): number {
    const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
    return Math.floor((principal * rateBps * durationSecs) / (SECONDS_PER_YEAR * 10000));
  }

  /**
   * Execute liquidation for a loan
   */
  async liquidateLoan(candidate: LiquidationCandidate): Promise<boolean> {
    const { loan, reason } = candidate;
    
    logger.info(`Attempting to liquidate loan`, {
      loanId: loan.account.id.toString(),
      borrower: loan.account.borrower.toBase58(),
      reason,
      healthFactorBps: candidate.healthFactorBps,
      secondsOverdue: candidate.secondsOverdue,
    });

    try {
      // Derive required PDAs and accounts
      const [borrowerProfilePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('profile'), loan.account.borrower.toBuffer()],
        CREDIT_MARKET_PROGRAM_ID
      );

      const lenderUsdc = await getAssociatedTokenAddress(
        USDC_MINT,
        loan.account.lender
      );

      // Build the liquidate instruction
      // Note: In production, you'd use the program IDL to build this properly
      const instruction = {
        programId: CREDIT_MARKET_PROGRAM_ID,
        keys: [
          { pubkey: this.liquidatorKeypair.publicKey, isSigner: true, isWritable: false },
          { pubkey: loan.publicKey, isSigner: false, isWritable: true },
          { pubkey: loan.account.vault, isSigner: false, isWritable: true },
          { pubkey: lenderUsdc, isSigner: false, isWritable: true },
          { pubkey: borrowerProfilePDA, isSigner: false, isWritable: true },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        data: Buffer.from([
          // liquidate_loan instruction discriminator
          // Would be calculated from IDL in production
          0x6c, 0x69, 0x71, 0x75, 0x69, 0x64, 0x61, 0x74,
        ]),
      };

      const transaction = new Transaction().add(instruction);
      
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [this.liquidatorKeypair],
        { commitment: 'confirmed' }
      );

      logger.success(`Loan liquidated successfully`, {
        loanId: loan.account.id.toString(),
        signature,
        reason,
      });

      return true;
    } catch (error) {
      logger.error(`Failed to liquidate loan`, {
        loanId: loan.account.id.toString(),
        error: String(error),
      });
      return false;
    }
  }

  /**
   * Main monitoring loop
   */
  async run(): Promise<void> {
    logger.info('Starting PLN Protocol Keeper Bot', {
      rpcUrl: RPC_URL,
      liquidator: this.liquidatorKeypair.publicKey.toBase58(),
      pollIntervalMs: POLL_INTERVAL_MS,
    });

    while (true) {
      try {
        logger.info('Scanning for liquidatable loans...');
        
        const activeLoans = await this.fetchActiveLoans();
        logger.info(`Found ${activeLoans.length} active loans`);

        const liquidationCandidates: LiquidationCandidate[] = [];

        for (const loan of activeLoans) {
          const candidate = await this.checkLiquidatable(loan);
          if (candidate) {
            liquidationCandidates.push(candidate);
          }
        }

        if (liquidationCandidates.length > 0) {
          logger.warn(`Found ${liquidationCandidates.length} loans eligible for liquidation`);
          
          for (const candidate of liquidationCandidates) {
            await this.liquidateLoan(candidate);
            // Small delay between liquidations to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } else {
          logger.info('No loans eligible for liquidation');
        }

      } catch (error) {
        logger.error('Error in monitoring loop', { error: String(error) });
      }

      // Wait for next polling interval
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }
}

// ============================================================================
// Stats and Health Check Endpoint
// ============================================================================

interface KeeperStats {
  startTime: Date;
  loansMonitored: number;
  loansLiquidated: number;
  lastScanTime: Date | null;
  lastLiquidationTime: Date | null;
}

const stats: KeeperStats = {
  startTime: new Date(),
  loansMonitored: 0,
  loansLiquidated: 0,
  lastScanTime: null,
  lastLiquidationTime: null,
};

// ============================================================================
// Main Entry Point
// ============================================================================

async function main() {
  console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║           PLN Protocol Keeper Bot v1.0.0                 ║
  ║         Automated Loan Liquidation Service               ║
  ╚═══════════════════════════════════════════════════════════╝
  `);

  const bot = new KeeperBot();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    logger.info('Received SIGINT, shutting down gracefully...');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, shutting down gracefully...');
    process.exit(0);
  });

  await bot.run();
}

main().catch((error) => {
  logger.error('Fatal error', { error: String(error) });
  process.exit(1);
});
