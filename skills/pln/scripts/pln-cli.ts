#!/usr/bin/env npx ts-node

/**
 * PLN CLI - PATH Liquidity Network Command Line Interface
 * Production-ready implementation for OpenClaw skill
 * 
 * Commands:
 *   activate  - Initialize wallet, show banner, connect to network
 *   deposit   - Deposit USDC to Liquidity Router for yield
 *   withdraw  - Withdraw USDC + earned yield
 *   borrow    - Request loan based on reputation
 *   repay     - Repay active loan + interest
 *   status    - Full portfolio overview
 *   report    - Configure update frequency
 */

import {
  Connection,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAccount,
} from '@solana/spl-token';
import * as anchor from '@coral-xyz/anchor';
import { Program, AnchorProvider, Wallet, BN } from '@coral-xyz/anchor';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// ============ Constants ============

// Contract addresses (Solana Devnet)
const REPUTATION_PROGRAM_ID = new PublicKey('7UkU7PFm4eNYoTT5pe3kCFYvVfahKe8oZH6W2pkaxCZY');
const CREDIT_MARKET_PROGRAM_ID = new PublicKey('6uPGiAg5V5vCMH3ExpDvEV78E3uXUpy6PdcMjNxwBgXp');
const LIQUIDITY_ROUTER_PROGRAM_ID = new PublicKey('AXQfi8qNUB4wShb3LRKuVnYPF2CErMv1N6KiRwdHmQBu');

// Devnet USDC
const USDC_MINT = new PublicKey('Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9dq22VJLJ');
const USDC_DECIMALS = 6;

// RPC
const DEVNET_RPC = 'https://api.devnet.solana.com';

// File paths
const PLN_DIR = path.join(os.homedir(), '.pln');
const WALLET_PATH = path.join(PLN_DIR, 'wallet.json');
const CONFIG_PATH = path.join(PLN_DIR, 'config.json');

// ============ Types ============

interface Config {
  reportFrequency: 'daily' | 'weekly' | 'monthly' | 'off';
  lastReport?: number;
  minP2pRateBps?: number;
  autoRoute?: boolean;
  strategy?: 'yield_optimizer' | 'trading_agent';
}

interface AgentProfile {
  wallet: PublicKey;
  loansTaken: number;
  loansRepaid: number;
  loansDefaulted: number;
  totalBorrowed: BN;
  totalRepaid: BN;
  totalLent: BN;
  score: number;
  createdAt: BN;
  updatedAt: BN;
  bump: number;
}

interface LenderPosition {
  wallet: PublicKey;
  totalDeposited: BN;
  inKamino: BN;
  inP2p: BN;
  minP2pRateBps: number;
  kaminoBufferBps: number;
  autoRoute: boolean;
  createdAt: BN;
  updatedAt: BN;
  bump: number;
}

interface Loan {
  id: BN;
  lender: PublicKey;
  borrower: PublicKey;
  principal: BN;
  rateBps: number;
  startTime: BN;
  endTime: BN;
  status: { active?: {} } | { repaid?: {} } | { defaulted?: {} } | { liquidated?: {} };
  vault: PublicKey;
  bump: number;
}

interface BorrowRequest {
  borrower: PublicKey;
  amount: BN;
  maxRateBps: number;
  durationSecs: BN;
  isActive: boolean;
  createdAt: BN;
  bump: number;
}

// ============ ASCII Banner ============

const BANNER = `
╔═══════════════════════════════════════════════════════════════╗
║     ____  __    _   __   ____            __                   ║
║    / __ \\/ /   / | / /  / __ \\_______  / /_____  _________   ║
║   / /_/ / /   /  |/ /  / /_/ / ___/ / / / __/ / / / __/ _ \\  ║
║  / ____/ /___/ /|  /  / ____/ /  / /_/ / /_/ /_/ / /_/  __/  ║
║ /_/   /_____/_/ |_/  /_/   /_/   \\____/\\__/\\____/\\__/\\___/   ║
║                                                               ║
║        PATH Liquidity Network — Built on Kamino               ║
╚═══════════════════════════════════════════════════════════════╝
`;

// ============ Utilities ============

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function getConnection(): Connection {
  return new Connection(DEVNET_RPC, 'confirmed');
}

function loadOrCreateWallet(): Keypair {
  ensureDir(PLN_DIR);
  
  if (fs.existsSync(WALLET_PATH)) {
    try {
      const secretKey = JSON.parse(fs.readFileSync(WALLET_PATH, 'utf-8'));
      return Keypair.fromSecretKey(Uint8Array.from(secretKey));
    } catch (e) {
      console.error('⚠ Failed to load existing wallet, creating new one...');
    }
  }
  
  const wallet = Keypair.generate();
  fs.writeFileSync(WALLET_PATH, JSON.stringify(Array.from(wallet.secretKey)));
  return wallet;
}

function loadConfig(): Config {
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    } catch {
      // Fall through to default
    }
  }
  return { reportFrequency: 'daily', autoRoute: true };
}

function saveConfig(config: Config): void {
  ensureDir(PLN_DIR);
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

function formatUsdc(amount: number | BN): string {
  const num = typeof amount === 'number' ? amount : amount.toNumber();
  return (num / Math.pow(10, USDC_DECIMALS)).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatUsdcCompact(amount: number | BN): string {
  const num = typeof amount === 'number' ? amount : amount.toNumber();
  return (num / Math.pow(10, USDC_DECIMALS)).toFixed(2);
}

async function getUsdcBalance(connection: Connection, owner: PublicKey): Promise<number> {
  try {
    const ata = await getAssociatedTokenAddress(USDC_MINT, owner);
    const account = await getAccount(connection, ata);
    return Number(account.amount);
  } catch {
    return 0;
  }
}

function loadIdl(name: string): any {
  const idlPath = path.join(__dirname, '..', 'idl', `${name}.json`);
  const idl = JSON.parse(fs.readFileSync(idlPath, 'utf-8'));
  
  // Inject program address if not present (required for Anchor)
  if (!idl.address) {
    switch (name) {
      case 'reputation':
        idl.address = REPUTATION_PROGRAM_ID.toBase58();
        break;
      case 'credit_market':
        idl.address = CREDIT_MARKET_PROGRAM_ID.toBase58();
        break;
      case 'liquidity_router':
        idl.address = LIQUIDITY_ROUTER_PROGRAM_ID.toBase58();
        break;
    }
  }
  
  return idl;
}

function getProvider(connection: Connection, wallet: Keypair): AnchorProvider {
  const anchorWallet = new Wallet(wallet);
  const provider = new AnchorProvider(connection, anchorWallet, {
    commitment: 'confirmed',
    preflightCommitment: 'confirmed',
  });
  anchor.setProvider(provider);
  return provider;
}

// PDA derivation helpers
function getReputationProfilePda(wallet: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('agent_profile'), wallet.toBuffer()],
    REPUTATION_PROGRAM_ID
  );
}

function getLenderPositionPda(wallet: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('position'), wallet.toBuffer()],
    LIQUIDITY_ROUTER_PROGRAM_ID
  );
}

function getBorrowRequestPda(wallet: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('borrow_request'), wallet.toBuffer()],
    CREDIT_MARKET_PROGRAM_ID
  );
}

function getLoanPda(loanId: BN): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('loan'), loanId.toArrayLike(Buffer, 'le', 8)],
    CREDIT_MARKET_PROGRAM_ID
  );
}

function getRouterConfigPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('config')],
    LIQUIDITY_ROUTER_PROGRAM_ID
  );
}

function getRouterVaultPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault')],
    LIQUIDITY_ROUTER_PROGRAM_ID
  );
}

function getReputationTier(score: number): { name: string; maxBorrow: string; rate: string } {
  if (score >= 900) return { name: 'Elite', maxBorrow: '$75,000', rate: '8-10%' };
  if (score >= 700) return { name: 'Trusted', maxBorrow: '$25,000', rate: '10-12%' };
  if (score >= 500) return { name: 'Established', maxBorrow: '$5,000', rate: '12-15%' };
  if (score >= 300) return { name: 'Building', maxBorrow: '$500', rate: '15-20%' };
  return { name: 'Newcomer', maxBorrow: '$50', rate: '20-25%' };
}

function shortenPubkey(pubkey: PublicKey | string): string {
  const str = typeof pubkey === 'string' ? pubkey : pubkey.toBase58();
  return `${str.slice(0, 4)}...${str.slice(-4)}`;
}

// ============ Commands ============

async function activate(): Promise<void> {
  console.log(BANNER);
  
  const connection = getConnection();
  const wallet = loadOrCreateWallet();
  const isNewWallet = !fs.existsSync(WALLET_PATH);
  
  console.log(`🔑 Wallet: ${wallet.publicKey.toBase58()}`);
  if (isNewWallet) {
    console.log('   ✓ Created new wallet');
  } else {
    console.log('   ✓ Loaded existing wallet');
  }
  console.log(`📍 Network: Solana Devnet\n`);
  
  // Check SOL balance
  let solBalance = await connection.getBalance(wallet.publicKey);
  console.log(`💰 SOL Balance: ${(solBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
  
  // Airdrop SOL if needed
  if (solBalance < 0.5 * LAMPORTS_PER_SOL) {
    console.log('   → Requesting devnet SOL airdrop...');
    try {
      const sig = await connection.requestAirdrop(wallet.publicKey, 2 * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(sig, 'confirmed');
      solBalance = await connection.getBalance(wallet.publicKey);
      console.log(`   ✓ Airdropped 2 SOL (new balance: ${(solBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL)`);
    } catch (e: any) {
      console.log('   ⚠ Airdrop failed (rate limited). Try again in ~1 minute.');
    }
  }
  
  // Check USDC balance
  const usdcBalance = await getUsdcBalance(connection, wallet.publicKey);
  console.log(`💵 USDC Balance: ${formatUsdc(usdcBalance)} USDC`);
  
  if (usdcBalance === 0) {
    console.log('   ⚠ No USDC. Get devnet USDC from a faucet or DEX.');
  }
  
  // Check/Create reputation profile
  const provider = getProvider(connection, wallet);
  const reputationIdl = loadIdl('reputation');
  const reputationProgram = new Program(reputationIdl as any, REPUTATION_PROGRAM_ID, provider);
  
  const [profilePda] = getReputationProfilePda(wallet.publicKey);
  let score = 500; // Default for new agents
  let profileExists = false;
  
  try {
    const profile = await (reputationProgram.account as any).agentProfile.fetch(profilePda) as AgentProfile;
    score = profile.score;
    profileExists = true;
  } catch {
    // Profile doesn't exist - create it
    console.log('\n📝 Creating reputation profile...');
    try {
      const tx = await reputationProgram.methods
        .registerAgent()
        .accounts({
          wallet: wallet.publicKey,
          profile: profilePda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      console.log(`   ✓ Profile created! Tx: ${shortenPubkey(tx)}`);
      profileExists = true;
    } catch (e: any) {
      console.log(`   ⚠ Could not create profile: ${e.message}`);
    }
  }
  
  // Display reputation
  const tier = getReputationTier(score);
  console.log(`\n📊 Reputation Score: ${score}/1000 (${tier.name})`);
  console.log(`   Credit Limit: ${tier.maxBorrow} | Typical Rate: ${tier.rate} APY`);
  
  // Show strategy options
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 CHOOSE YOUR STRATEGY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('   [1] 💰 YIELD OPTIMIZER');
  console.log('       Lend USDC, earn Kamino base yield (~8% APY)');
  console.log('       + P2P premium when agent demand is high (~12-25% APY)');
  console.log('       Auto-rebalances between Kamino and P2P for best returns');
  console.log('');
  console.log('   [2] 🤖 TRADING AGENT');
  console.log('       Borrow against your on-chain reputation');
  console.log('       Execute strategies on Jupiter + Kamino');
  console.log('       Transfer hooks ensure borrowed funds stay in DeFi');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 Ready! What would you like to do?');
  console.log('');
  console.log('   💰 LEND    pln.deposit <amount>     Deposit USDC (Yield Optimizer)');
  console.log('   🏦 BORROW  pln.borrow <amt> <days>  Request a loan (Trading Agent)');
  console.log('   📊 STATUS  pln.status              Check your portfolio');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

async function deposit(amount: number): Promise<void> {
  console.log(`\n💰 Depositing ${amount.toFixed(2)} USDC to Liquidity Router...\n`);
  
  if (amount <= 0) {
    console.log('❌ Amount must be greater than 0');
    return;
  }
  
  if (amount > 100) {
    console.log('⚠ Note: Max deposit is 100 USDC (devnet safety limit)');
    amount = 100;
  }
  
  const connection = getConnection();
  const wallet = loadOrCreateWallet();
  
  // Check USDC balance
  const usdcBalance = await getUsdcBalance(connection, wallet.publicKey);
  const amountLamports = new BN(Math.floor(amount * Math.pow(10, USDC_DECIMALS)));
  
  if (usdcBalance < amountLamports.toNumber()) {
    console.log(`❌ Insufficient USDC balance`);
    console.log(`   Required: ${amount.toFixed(2)} USDC`);
    console.log(`   Available: ${formatUsdc(usdcBalance)} USDC`);
    return;
  }
  
  const provider = getProvider(connection, wallet);
  const routerIdl = loadIdl('liquidity_router');
  const routerProgram = new Program(routerIdl as any, LIQUIDITY_ROUTER_PROGRAM_ID, provider);
  
  try {
    // Derive PDAs
    const [configPda] = getRouterConfigPda();
    const [positionPda] = getLenderPositionPda(wallet.publicKey);
    const [routerVaultPda] = getRouterVaultPda();
    const lenderUsdc = await getAssociatedTokenAddress(USDC_MINT, wallet.publicKey);
    
    console.log('📋 Transaction Details:');
    console.log(`   From:   ${shortenPubkey(wallet.publicKey)}`);
    console.log(`   To:     Liquidity Router`);
    console.log(`   Amount: ${amount.toFixed(2)} USDC`);
    console.log('');
    
    // Execute deposit
    const tx = await routerProgram.methods
      .deposit(amountLamports)
      .accounts({
        lender: wallet.publicKey,
        position: positionPda,
        lenderUsdc: lenderUsdc,
        routerVault: routerVaultPda,
        usdcMint: USDC_MINT,
        config: configPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    
    console.log('✅ Deposit successful!');
    console.log(`   Transaction: ${shortenPubkey(tx)}`);
    console.log(`   Explorer: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
    
    // Fetch updated position
    try {
      const position = await (routerProgram.account as any).lenderPosition.fetch(positionPda) as LenderPosition;
      console.log('\n━━━ Updated Position ━━━');
      console.log(`   Total Deposited: ${formatUsdc(position.totalDeposited)} USDC`);
      console.log(`   Auto-Route: ${position.autoRoute ? 'Enabled ✓' : 'Disabled'}`);
    } catch {
      // Position fetch is optional
    }
    
  } catch (error: any) {
    console.log('❌ Deposit failed');
    
    if (error.logs) {
      const errorLog = error.logs.find((log: string) => 
        log.includes('Error') || log.includes('error') || log.includes('failed')
      );
      if (errorLog) console.log(`   Log: ${errorLog}`);
    }
    
    // Parse specific error codes
    if (error.code === 6003 || error.message?.includes('ExceedsMaxDeposit')) {
      console.log('   Reason: Exceeds max deposit of 100 USDC (devnet safety)');
    } else if (error.code === 6002 || error.message?.includes('InsufficientFunds')) {
      console.log('   Reason: Insufficient funds');
    } else if (error.message) {
      console.log(`   Details: ${error.message.slice(0, 100)}`);
    }
    
    process.exit(1);
  }
}

async function withdraw(amount: number | 'all'): Promise<void> {
  const amountStr = amount === 'all' ? 'all' : `${amount.toFixed(2)}`;
  console.log(`\n💸 Withdrawing ${amountStr} USDC from Liquidity Router...\n`);
  
  const connection = getConnection();
  const wallet = loadOrCreateWallet();
  const provider = getProvider(connection, wallet);
  
  const routerIdl = loadIdl('liquidity_router');
  const routerProgram = new Program(routerIdl as any, LIQUIDITY_ROUTER_PROGRAM_ID, provider);
  
  // Fetch current position
  const [positionPda] = getLenderPositionPda(wallet.publicKey);
  
  let position: LenderPosition;
  try {
    position = await (routerProgram.account as any).lenderPosition.fetch(positionPda) as LenderPosition;
  } catch {
    console.log('❌ No lender position found. Nothing to withdraw.');
    return;
  }
  
  const totalDeposited = position.totalDeposited.toNumber();
  const inKamino = position.inKamino.toNumber();
  const inP2p = position.inP2p.toNumber();
  const available = inKamino; // P2P funds are locked until loan repaid
  
  console.log('📊 Current Position:');
  console.log(`   Total Deposited: ${formatUsdc(totalDeposited)} USDC`);
  console.log(`   In Kamino:       ${formatUsdc(inKamino)} USDC (available)`);
  console.log(`   In P2P Loans:    ${formatUsdc(inP2p)} USDC (locked)`);
  console.log('');
  
  // Determine withdraw amount
  let withdrawAmount: BN;
  if (amount === 'all') {
    withdrawAmount = new BN(available);
  } else {
    withdrawAmount = new BN(Math.floor(amount * Math.pow(10, USDC_DECIMALS)));
  }
  
  if (withdrawAmount.toNumber() > available) {
    console.log(`❌ Cannot withdraw ${formatUsdc(withdrawAmount)} USDC`);
    console.log(`   Available: ${formatUsdc(available)} USDC`);
    console.log(`   (${formatUsdc(inP2p)} USDC locked in P2P loans)`);
    return;
  }
  
  if (withdrawAmount.toNumber() === 0) {
    console.log('❌ No funds available to withdraw');
    return;
  }
  
  try {
    const [routerVaultPda] = getRouterVaultPda();
    const lenderUsdc = await getAssociatedTokenAddress(USDC_MINT, wallet.publicKey);
    
    const tx = await routerProgram.methods
      .withdraw(withdrawAmount)
      .accounts({
        lender: wallet.publicKey,
        position: positionPda,
        lenderUsdc: lenderUsdc,
        routerVault: routerVaultPda,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
    
    console.log('✅ Withdrawal successful!');
    console.log(`   Amount: ${formatUsdc(withdrawAmount)} USDC`);
    console.log(`   Transaction: ${shortenPubkey(tx)}`);
    console.log(`   Explorer: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
    
  } catch (error: any) {
    console.log('❌ Withdrawal failed');
    if (error.message) {
      console.log(`   Details: ${error.message.slice(0, 100)}`);
    }
    process.exit(1);
  }
}

async function borrow(amount: number, durationDays: number, maxRateBps: number): Promise<void> {
  console.log(`\n🏦 Requesting ${amount.toFixed(2)} USDC loan for ${durationDays} days...\n`);
  
  if (amount <= 0) {
    console.log('❌ Amount must be greater than 0');
    return;
  }
  
  const connection = getConnection();
  const wallet = loadOrCreateWallet();
  const provider = getProvider(connection, wallet);
  
  // Load programs
  const reputationIdl = loadIdl('reputation');
  const creditMarketIdl = loadIdl('credit_market');
  const reputationProgram = new Program(reputationIdl as any, REPUTATION_PROGRAM_ID, provider);
  const creditMarketProgram = new Program(creditMarketIdl as any, CREDIT_MARKET_PROGRAM_ID, provider);
  
  // Check reputation
  const [profilePda] = getReputationProfilePda(wallet.publicKey);
  let score = 500;
  
  try {
    const profile = await (reputationProgram.account as any).agentProfile.fetch(profilePda) as AgentProfile;
    score = profile.score;
    console.log(`📊 Reputation Score: ${score}/1000`);
  } catch {
    console.log('📝 No reputation profile found. Creating one...');
    try {
      await reputationProgram.methods
        .registerAgent()
        .accounts({
          wallet: wallet.publicKey,
          profile: profilePda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      console.log('   ✓ Profile created');
    } catch (e: any) {
      console.log(`   ⚠ Could not create profile: ${e.message}`);
    }
  }
  
  const tier = getReputationTier(score);
  console.log(`   Tier: ${tier.name} | Max: ${tier.maxBorrow} | Rate: ${tier.rate} APY`);
  console.log('');
  
  // Check for existing borrow request
  const [requestPda] = getBorrowRequestPda(wallet.publicKey);
  
  try {
    const existingRequest = await (creditMarketProgram.account as any).borrowRequest.fetch(requestPda);
    if (existingRequest.isActive) {
      console.log('⚠ You already have an active borrow request:');
      console.log(`   Amount: ${formatUsdc(existingRequest.amount)} USDC`);
      console.log(`   Max Rate: ${existingRequest.maxRateBps / 100}% APY`);
      console.log('\n   Cancel it first or wait for it to be filled.');
      return;
    }
  } catch {
    // No existing request - good to proceed
  }
  
  // Convert parameters
  const amountBn = new BN(Math.floor(amount * Math.pow(10, USDC_DECIMALS)));
  const durationSecs = new BN(durationDays * 24 * 60 * 60);
  
  console.log('📋 Borrow Request:');
  console.log(`   Amount:    ${amount.toFixed(2)} USDC`);
  console.log(`   Duration:  ${durationDays} days`);
  console.log(`   Max Rate:  ${maxRateBps / 100}% APY`);
  console.log('');
  
  try {
    const tx = await creditMarketProgram.methods
      .postBorrowRequest(amountBn, maxRateBps, durationSecs)
      .accounts({
        borrower: wallet.publicKey,
        request: requestPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    
    console.log('✅ Borrow request created!');
    console.log(`   Transaction: ${shortenPubkey(tx)}`);
    console.log(`   Explorer: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
    console.log('\n⏳ Waiting for lender match... Check status with: pln.status');
    
  } catch (error: any) {
    console.log('❌ Borrow request failed');
    
    if (error.logs) {
      const errorLog = error.logs.find((log: string) => log.includes('Error'));
      if (errorLog) console.log(`   Log: ${errorLog}`);
    }
    
    if (error.message?.includes('already in use')) {
      console.log('   Reason: You already have an active borrow request');
    } else if (error.message?.includes('insufficient funds') || error.message?.includes('0x1')) {
      console.log('   Reason: Insufficient SOL for transaction fee');
      console.log('   Run: pln.activate (to get devnet SOL)');
    } else if (error.message) {
      console.log(`   Details: ${error.message.slice(0, 100)}`);
    }
    
    process.exit(1);
  }
}

async function repay(loanIdStr: string): Promise<void> {
  console.log(`\n💸 Repaying loan #${loanIdStr}...\n`);
  
  const loanId = new BN(loanIdStr);
  
  const connection = getConnection();
  const wallet = loadOrCreateWallet();
  const provider = getProvider(connection, wallet);
  
  const creditMarketIdl = loadIdl('credit_market');
  const reputationIdl = loadIdl('reputation');
  const creditMarketProgram = new Program(creditMarketIdl as any, CREDIT_MARKET_PROGRAM_ID, provider);
  const reputationProgram = new Program(reputationIdl as any, REPUTATION_PROGRAM_ID, provider);
  
  // Derive loan PDA
  const [loanPda] = getLoanPda(loanId);
  
  // Fetch loan
  let loan: Loan;
  try {
    loan = await (creditMarketProgram.account as any).loan.fetch(loanPda) as Loan;
  } catch {
    console.log(`❌ Loan #${loanIdStr} not found`);
    console.log('   Use pln.status to see your active loans');
    return;
  }
  
  // Verify borrower
  if (!loan.borrower.equals(wallet.publicKey)) {
    console.log('❌ You are not the borrower of this loan');
    console.log(`   Loan borrower: ${shortenPubkey(loan.borrower)}`);
    console.log(`   Your wallet:   ${shortenPubkey(wallet.publicKey)}`);
    return;
  }
  
  // Check loan status
  if (!('active' in loan.status)) {
    const statusStr = 'repaid' in loan.status ? 'Already Repaid' :
                      'defaulted' in loan.status ? 'Defaulted' :
                      'liquidated' in loan.status ? 'Liquidated' : 'Unknown';
    console.log(`❌ Loan is not active (Status: ${statusStr})`);
    return;
  }
  
  // Calculate repayment
  const principal = loan.principal.toNumber();
  const now = Math.floor(Date.now() / 1000);
  const elapsed = Math.max(0, now - loan.startTime.toNumber());
  const interest = Math.ceil(principal * (loan.rateBps / 10000) * (elapsed / (365 * 24 * 60 * 60)));
  const totalRepayment = principal + interest;
  
  console.log('📋 Loan Details:');
  console.log(`   Principal:    ${formatUsdc(principal)} USDC`);
  console.log(`   Rate:         ${loan.rateBps / 100}% APY`);
  console.log(`   Interest:     ~${formatUsdc(interest)} USDC`);
  console.log(`   Total Due:    ~${formatUsdc(totalRepayment)} USDC`);
  console.log(`   Lender:       ${shortenPubkey(loan.lender)}`);
  console.log('');
  
  // Check USDC balance
  const usdcBalance = await getUsdcBalance(connection, wallet.publicKey);
  if (usdcBalance < totalRepayment) {
    console.log(`❌ Insufficient USDC balance`);
    console.log(`   Required:  ~${formatUsdc(totalRepayment)} USDC`);
    console.log(`   Available: ${formatUsdc(usdcBalance)} USDC`);
    return;
  }
  
  try {
    const borrowerUsdc = await getAssociatedTokenAddress(USDC_MINT, wallet.publicKey);
    const lenderUsdc = await getAssociatedTokenAddress(USDC_MINT, loan.lender);
    
    // Repay loan
    const tx = await creditMarketProgram.methods
      .repayLoan(loanId)
      .accounts({
        borrower: wallet.publicKey,
        loan: loanPda,
        borrowerUsdc: borrowerUsdc,
        lenderUsdc: lenderUsdc,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
    
    console.log('✅ Loan repaid!');
    console.log(`   Transaction: ${shortenPubkey(tx)}`);
    console.log(`   Explorer: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
    
    // Update reputation
    const [profilePda] = getReputationProfilePda(wallet.publicKey);
    try {
      const repAmountBn = new BN(totalRepayment);
      const repTx = await reputationProgram.methods
        .recordRepayment(repAmountBn)
        .accounts({
          profile: profilePda,
          authority: wallet.publicKey,
        })
        .rpc();
      console.log(`\n📈 Reputation updated! (+points for successful repayment)`);
    } catch {
      console.log('\n⚠ Could not update reputation (loan still repaid successfully)');
    }
    
  } catch (error: any) {
    console.log('❌ Repayment failed');
    
    if (error.message?.includes('LoanNotActive')) {
      console.log('   Reason: Loan is no longer active');
    } else if (error.message) {
      console.log(`   Details: ${error.message.slice(0, 100)}`);
    }
    
    process.exit(1);
  }
}

async function status(): Promise<void> {
  console.log('\n📊 PLN Portfolio Status\n');
  
  const connection = getConnection();
  const wallet = loadOrCreateWallet();
  const provider = getProvider(connection, wallet);
  
  console.log(`🔑 Wallet: ${wallet.publicKey.toBase58()}`);
  console.log(`📍 Network: Solana Devnet\n`);
  
  // Balances
  const solBalance = await connection.getBalance(wallet.publicKey);
  const usdcBalance = await getUsdcBalance(connection, wallet.publicKey);
  
  console.log(`💰 SOL Balance:  ${(solBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
  console.log(`💵 USDC Balance: ${formatUsdc(usdcBalance)} USDC`);
  
  // Load programs
  const reputationIdl = loadIdl('reputation');
  const routerIdl = loadIdl('liquidity_router');
  const creditIdl = loadIdl('credit_market');
  
  const reputationProgram = new Program(reputationIdl as any, REPUTATION_PROGRAM_ID, provider);
  const routerProgram = new Program(routerIdl as any, LIQUIDITY_ROUTER_PROGRAM_ID, provider);
  const creditProgram = new Program(creditIdl as any, CREDIT_MARKET_PROGRAM_ID, provider);
  
  // ━━━ Reputation ━━━
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📈 REPUTATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const [profilePda] = getReputationProfilePda(wallet.publicKey);
  
  try {
    const profile = await (reputationProgram.account as any).agentProfile.fetch(profilePda) as AgentProfile;
    const tier = getReputationTier(profile.score);
    
    console.log(`   Score:           ${profile.score} / 1000 (${tier.name})`);
    console.log(`   Credit Limit:    ${tier.maxBorrow}`);
    console.log(`   ─────────────────────────────────────`);
    console.log(`   Loans Taken:     ${profile.loansTaken}`);
    console.log(`   Loans Repaid:    ${profile.loansRepaid}`);
    console.log(`   Loans Defaulted: ${profile.loansDefaulted}`);
    console.log(`   Total Borrowed:  ${formatUsdc(profile.totalBorrowed)} USDC`);
    console.log(`   Total Repaid:    ${formatUsdc(profile.totalRepaid)} USDC`);
    console.log(`   Total Lent:      ${formatUsdc(profile.totalLent)} USDC`);
    console.log(`   ─────────────────────────────────────`);
    console.log(`   Est. Borrow Rate: ${tier.rate} APY`);
  } catch {
    console.log('   No reputation profile found.');
    console.log('   → Run: pln.activate');
  }
  
  // ━━━ Lender Position ━━━
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💰 LENDER POSITION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const [positionPda] = getLenderPositionPda(wallet.publicKey);
  
  try {
    const position = await (routerProgram.account as any).lenderPosition.fetch(positionPda) as LenderPosition;
    
    const totalDeposited = position.totalDeposited.toNumber();
    const inKamino = position.inKamino.toNumber();
    const inP2p = position.inP2p.toNumber();
    
    // Kamino base yield (~8% APY) vs P2P premium (~12-25% APY depending on demand)
    const kaminoApy = 8.2;  // Base Kamino vault yield
    const p2pApy = 18.0;    // Premium P2P yield from agent borrowers
    const blendedApy = totalDeposited > 0 
      ? ((inKamino * kaminoApy + inP2p * p2pApy) / totalDeposited)
      : 0;
    
    // Calculate allocation percentages
    const kaminoPct = totalDeposited > 0 ? Math.round((inKamino / totalDeposited) * 100) : 0;
    const p2pPct = totalDeposited > 0 ? Math.round((inP2p / totalDeposited) * 100) : 0;
    
    console.log(`   Total Deposited: ${formatUsdc(totalDeposited)} USDC`);
    console.log('');
    console.log('   🏦 Kamino Yield (Base Layer):');
    console.log(`   └─ ${formatUsdc(inKamino)} USDC (${kaminoPct}%) @ ${kaminoApy}% APY`);
    console.log('');
    console.log('   🤝 P2P Yield (Premium Layer):');
    console.log(`   └─ ${formatUsdc(inP2p)} USDC (${p2pPct}%) @ ${p2pApy}% APY`);
    console.log('');
    console.log(`   ─────────────────────────────────────`);
    console.log(`   📊 Blended APY:  ${blendedApy.toFixed(1)}%`);
    console.log(`   Min P2P Rate:    ${(position.minP2pRateBps / 100).toFixed(1)}% APY`);
    console.log(`   Auto-Route:      ${position.autoRoute ? 'Enabled ✓' : 'Disabled'}`);
  } catch {
    console.log('   No lender position found.');
    console.log('   → Start lending: pln.deposit <amount>');
  }
  
  // ━━━ Active Loans ━━━
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🏦 ACTIVE LOANS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    // Loans where user is borrower
    const borrowerLoans = await (creditProgram.account as any).loan.all([
      {
        memcmp: {
          offset: 8 + 8 + 32, // discriminator + id + lender = offset to borrower
          bytes: wallet.publicKey.toBase58(),
        },
      },
    ]);
    
    // Loans where user is lender
    const lenderLoans = await (creditProgram.account as any).loan.all([
      {
        memcmp: {
          offset: 8 + 8, // discriminator + id = offset to lender
          bytes: wallet.publicKey.toBase58(),
        },
      },
    ]);
    
    const activeAsBorrower = borrowerLoans.filter((l: any) => 'active' in l.account.status);
    const activeAsLender = lenderLoans.filter((l: any) => 'active' in l.account.status);
    
    if (activeAsBorrower.length === 0 && activeAsLender.length === 0) {
      console.log('   No active loans.');
    } else {
      if (activeAsBorrower.length > 0) {
        console.log('\n   As Borrower:');
        for (const l of activeAsBorrower) {
          const loan = l.account as Loan;
          const endDate = new Date(loan.endTime.toNumber() * 1000);
          const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
          
          console.log(`   ┌─ Loan #${loan.id.toString()}`);
          console.log(`   │  Principal: ${formatUsdc(loan.principal)} USDC @ ${loan.rateBps / 100}% APY`);
          console.log(`   │  Due:       ${endDate.toLocaleDateString()} (${daysLeft} days left)`);
          console.log(`   └─ Lender:    ${shortenPubkey(loan.lender)}`);
        }
      }
      
      if (activeAsLender.length > 0) {
        console.log('\n   As Lender:');
        for (const l of activeAsLender) {
          const loan = l.account as Loan;
          const endDate = new Date(loan.endTime.toNumber() * 1000);
          const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
          
          console.log(`   ┌─ Loan #${loan.id.toString()}`);
          console.log(`   │  Principal: ${formatUsdc(loan.principal)} USDC @ ${loan.rateBps / 100}% APY`);
          console.log(`   │  Due:       ${endDate.toLocaleDateString()} (${daysLeft} days left)`);
          console.log(`   └─ Borrower:  ${shortenPubkey(loan.borrower)}`);
        }
      }
    }
    
    // Check for pending borrow request
    const [requestPda] = getBorrowRequestPda(wallet.publicKey);
    try {
      const request = await (creditProgram.account as any).borrowRequest.fetch(requestPda) as BorrowRequest;
      if (request.isActive) {
        console.log('\n   ⏳ Pending Borrow Request:');
        console.log(`   │  Amount:   ${formatUsdc(request.amount)} USDC`);
        console.log(`   │  Max Rate: ${request.maxRateBps / 100}% APY`);
        console.log(`   └─ Duration: ${Math.floor(request.durationSecs.toNumber() / (24 * 60 * 60))} days`);
      }
    } catch {
      // No pending request
    }
    
  } catch (e: any) {
    console.log(`   Error fetching loans: ${e.message}`);
  }
  
  // Config
  const config = loadConfig();
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚙️  SETTINGS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   Report Frequency: ${config.reportFrequency}`);
  console.log(`   → Change with: pln.report <daily|weekly|monthly|off>`);
  
  console.log('\n');
}

async function report(frequency: string): Promise<void> {
  const validFrequencies = ['daily', 'weekly', 'monthly', 'off'];
  
  if (!validFrequencies.includes(frequency)) {
    console.log(`\n❌ Invalid frequency: "${frequency}"`);
    console.log(`   Valid options: ${validFrequencies.join(', ')}`);
    return;
  }
  
  const config = loadConfig();
  config.reportFrequency = frequency as Config['reportFrequency'];
  config.lastReport = Date.now();
  saveConfig(config);
  
  console.log(`\n✅ Portfolio reports set to: ${frequency}`);
  
  if (frequency === 'off') {
    console.log('   You will no longer receive automatic updates.');
  } else {
    console.log(`   You will receive ${frequency} portfolio summaries.`);
  }
  console.log('');
}

// ============ CLI Parser ============

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];
  
  // Argument parser helper
  const getArg = (name: string): string | undefined => {
    const idx = args.indexOf(`--${name}`);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : undefined;
  };
  
  const getPositional = (index: number): string | undefined => {
    // Filter out --flag and their values
    const positionals: string[] = [];
    for (let i = 1; i < args.length; i++) {
      if (args[i].startsWith('--')) {
        i++; // Skip flag value
      } else {
        positionals.push(args[i]);
      }
    }
    return positionals[index];
  };
  
  if (!command) {
    console.log(BANNER);
    console.log('Usage: pln-cli.ts <command> [options]\n');
    console.log('Commands:');
    console.log('  activate              Initialize wallet and get devnet funds');
    console.log('  deposit <amount>      Deposit USDC to earn yield');
    console.log('  withdraw <amount>     Withdraw USDC + earned yield');
    console.log('  borrow <amt> <days>   Request loan against reputation');
    console.log('  repay <loan_id>       Repay an active loan');
    console.log('  status                Full portfolio overview');
    console.log('  report <frequency>    Set update frequency (daily/weekly/monthly/off)');
    console.log('\nExamples:');
    console.log('  pln-cli.ts activate');
    console.log('  pln-cli.ts deposit 100');
    console.log('  pln-cli.ts borrow 500 7');
    console.log('  pln-cli.ts borrow 500 7 --max-rate 1500');
    console.log('  pln-cli.ts repay 42');
    console.log('  pln-cli.ts status');
    console.log('  pln-cli.ts report daily');
    return;
  }
  
  try {
    switch (command) {
      case 'activate':
        await activate();
        break;
        
      case 'deposit': {
        const amount = parseFloat(getPositional(0) || getArg('amount') || '0');
        if (amount <= 0) {
          console.log('❌ Usage: pln deposit <amount>');
          console.log('   Example: pln deposit 100');
          process.exit(1);
        }
        await deposit(amount);
        break;
      }
      
      case 'withdraw': {
        const amountArg = getPositional(0) || getArg('amount') || '0';
        if (amountArg.toLowerCase() === 'all') {
          await withdraw('all');
        } else {
          const amount = parseFloat(amountArg);
          if (amount <= 0) {
            console.log('❌ Usage: pln withdraw <amount>');
            console.log('   Example: pln withdraw 100');
            console.log('   Example: pln withdraw all');
            process.exit(1);
          }
          await withdraw(amount);
        }
        break;
      }
      
      case 'borrow': {
        const amount = parseFloat(getPositional(0) || getArg('amount') || '0');
        const duration = parseInt(getPositional(1) || getArg('duration') || '7');
        const maxRate = parseInt(getArg('max-rate') || '1500');
        
        if (amount <= 0) {
          console.log('❌ Usage: pln borrow <amount> [duration_days]');
          console.log('   Example: pln borrow 500 7');
          console.log('   Example: pln borrow 500 7 --max-rate 2000');
          process.exit(1);
        }
        await borrow(amount, duration, maxRate);
        break;
      }
      
      case 'repay': {
        const loanId = getPositional(0) || getArg('loan') || getArg('id');
        if (!loanId) {
          console.log('❌ Usage: pln repay <loan_id>');
          console.log('   Example: pln repay 42');
          process.exit(1);
        }
        await repay(loanId);
        break;
      }
      
      case 'status':
        await status();
        break;
        
      case 'report': {
        const freq = getPositional(0) || getArg('frequency') || 'daily';
        await report(freq);
        break;
      }
      
      default:
        console.log(`❌ Unknown command: ${command}`);
        console.log('   Run without arguments to see available commands.');
        process.exit(1);
    }
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message || error}`);
    if (process.env.DEBUG) {
      console.error('\nFull error:', error);
    }
    process.exit(1);
  }
}

main();
