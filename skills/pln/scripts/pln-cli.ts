#!/usr/bin/env npx ts-node

/**
 * PLN CLI - PATH Liquidity Network Command Line Interface
 * Interacts with deployed Solana devnet contracts
 */

import {
  Connection,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import * as anchor from '@coral-xyz/anchor';
import { Program, AnchorProvider, Wallet, BN } from '@coral-xyz/anchor';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Contract addresses (Solana Devnet)
const REPUTATION_PROGRAM_ID = new PublicKey('7UkU7PFm4eNYoTT5pe3kCFYvVfahKe8oZH6W2pkaxCZY');
const CREDIT_MARKET_PROGRAM_ID = new PublicKey('6uPGiAg5V5vCMH3ExpDvEV78E3uXUpy6PdcMjNxwBgXp');
const LIQUIDITY_ROUTER_PROGRAM_ID = new PublicKey('AXQfi8qNUB4wShb3LRKuVnYPF2CErMv1N6KiRwdHmQBu');

// Devnet USDC (use the same as frontend)
const USDC_MINT = new PublicKey('Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9dq22VJLJ');
const USDC_DECIMALS = 6;

// Connection
const DEVNET_RPC = 'https://api.devnet.solana.com';

// Wallet path
const WALLET_PATH = path.join(os.homedir(), '.pln', 'wallet.json');

interface Config {
  reportFrequency: 'daily' | 'weekly' | 'monthly';
}

const CONFIG_PATH = path.join(os.homedir(), '.pln', 'config.json');

// ============ Utilities ============

function getConnection(): Connection {
  return new Connection(DEVNET_RPC, 'confirmed');
}

function loadOrCreateWallet(): Keypair {
  const walletDir = path.dirname(WALLET_PATH);
  
  if (!fs.existsSync(walletDir)) {
    fs.mkdirSync(walletDir, { recursive: true });
  }
  
  if (fs.existsSync(WALLET_PATH)) {
    const secretKey = JSON.parse(fs.readFileSync(WALLET_PATH, 'utf-8'));
    return Keypair.fromSecretKey(Uint8Array.from(secretKey));
  }
  
  const wallet = Keypair.generate();
  fs.writeFileSync(WALLET_PATH, JSON.stringify(Array.from(wallet.secretKey)));
  console.log('✓ Created new wallet');
  return wallet;
}

function loadConfig(): Config {
  if (fs.existsSync(CONFIG_PATH)) {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  }
  return { reportFrequency: 'daily' };
}

function saveConfig(config: Config): void {
  const configDir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

function formatUsdc(amount: number | BN): string {
  const num = typeof amount === 'number' ? amount : amount.toNumber();
  return (num / Math.pow(10, USDC_DECIMALS)).toFixed(2);
}

async function getUsdcBalance(connection: Connection, owner: PublicKey): Promise<number> {
  try {
    const ata = await getAssociatedTokenAddress(USDC_MINT, owner);
    const balance = await connection.getTokenAccountBalance(ata);
    return balance.value.uiAmount || 0;
  } catch {
    return 0;
  }
}

// ============ Commands ============

async function activate(): Promise<void> {
  console.log('\n🚀 PLN Skill Activation\n');
  
  const connection = getConnection();
  const wallet = loadOrCreateWallet();
  
  console.log(`Wallet: ${wallet.publicKey.toBase58()}`);
  
  // Check SOL balance
  const solBalance = await connection.getBalance(wallet.publicKey);
  console.log(`SOL Balance: ${(solBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
  
  // Airdrop SOL if needed
  if (solBalance < 0.1 * LAMPORTS_PER_SOL) {
    console.log('\nRequesting SOL airdrop...');
    try {
      const sig = await connection.requestAirdrop(wallet.publicKey, 2 * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(sig);
      console.log('✓ Airdropped 2 SOL');
    } catch (e) {
      console.log('⚠ Airdrop failed (rate limited). Try again in a minute.');
    }
  }
  
  // Check USDC balance
  const usdcBalance = await getUsdcBalance(connection, wallet.publicKey);
  console.log(`USDC Balance: ${usdcBalance.toFixed(2)} USDC`);
  
  // Note: Devnet USDC airdrop would require a faucet or mint authority
  if (usdcBalance === 0) {
    console.log('\n⚠ No USDC balance. To get devnet USDC:');
    console.log('  1. Use a Solana devnet faucet');
    console.log('  2. Or swap devnet SOL for USDC on a devnet DEX');
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('What would you like to do?');
  console.log('  1. Lend USDC to earn yield   → pln deposit --amount <USDC>');
  console.log('  2. Borrow USDC for trading   → pln borrow --amount <USDC>');
  console.log('  3. Check your status         → pln status');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

async function deposit(amount: number): Promise<void> {
  console.log(`\n💰 Depositing ${amount} USDC to Liquidity Router...\n`);
  
  const connection = getConnection();
  const wallet = loadOrCreateWallet();
  
  // Check USDC balance
  const balance = await getUsdcBalance(connection, wallet.publicKey);
  if (balance < amount) {
    console.log(`❌ Insufficient USDC balance. You have ${balance.toFixed(2)} USDC.`);
    return;
  }
  
  try {
    // Set up Anchor provider
    const anchorWallet = new Wallet(wallet);
    const provider = new AnchorProvider(connection, anchorWallet, {
      commitment: 'confirmed',
      preflightCommitment: 'confirmed',
    });
    
    // Load IDL from file
    const idlPath = path.join(__dirname, '..', 'idl', 'liquidity_router.json');
    const idl = JSON.parse(fs.readFileSync(idlPath, 'utf-8'));
    
    // Set the provider globally for Anchor
    anchor.setProvider(provider);
    
    // Create program interface
    const program = new Program(idl as any, LIQUIDITY_ROUTER_PROGRAM_ID, provider);
    
    // Derive PDAs
    // Config PDA: seeds = ["config"]
    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('config')],
      LIQUIDITY_ROUTER_PROGRAM_ID
    );
    
    // Lender Position PDA: seeds = ["position", lender.key]
    const [positionPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('position'), wallet.publicKey.toBuffer()],
      LIQUIDITY_ROUTER_PROGRAM_ID
    );
    
    // Router Vault PDA: seeds = ["vault"]
    const [routerVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('vault')],
      LIQUIDITY_ROUTER_PROGRAM_ID
    );
    
    // Get or create lender's USDC ATA
    const lenderUsdc = await getAssociatedTokenAddress(USDC_MINT, wallet.publicKey);
    
    // Check if lender USDC account exists
    const lenderUsdcInfo = await connection.getAccountInfo(lenderUsdc);
    if (!lenderUsdcInfo) {
      console.log('❌ No USDC token account found. Please get some devnet USDC first.');
      return;
    }
    
    // Convert amount to lamports (USDC has 6 decimals)
    const amountLamports = new BN(amount * Math.pow(10, USDC_DECIMALS));
    
    console.log('📋 Transaction Details:');
    console.log(`   Lender: ${wallet.publicKey.toBase58()}`);
    console.log(`   Position PDA: ${positionPda.toBase58()}`);
    console.log(`   Router Vault: ${routerVaultPda.toBase58()}`);
    console.log(`   Amount: ${amount} USDC (${amountLamports.toString()} base units)`);
    console.log('');
    
    // Call the deposit instruction
    const tx = await program.methods
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
    console.log(`   Transaction: ${tx}`);
    console.log(`   Explorer: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
    
  } catch (error: any) {
    console.log('❌ Deposit failed:');
    
    // Parse Anchor errors
    if (error.logs) {
      const errorLog = error.logs.find((log: string) => log.includes('Error'));
      if (errorLog) {
        console.log(`   ${errorLog}`);
      }
    }
    
    // Check for specific error codes from IDL
    if (error.code) {
      switch (error.code) {
        case 6000:
          console.log('   Error: Unauthorized');
          break;
        case 6002:
          console.log('   Error: Insufficient funds');
          break;
        case 6003:
          console.log('   Error: Exceeds max deposit of $100 USDC (mainnet safety)');
          break;
        default:
          console.log(`   Error code: ${error.code}`);
      }
    } else if (error.message) {
      console.log(`   ${error.message}`);
    }
    
    // Log full error for debugging
    if (process.env.DEBUG) {
      console.log('\n   Full error:', error);
    }
  }
}

async function borrow(amount: number, duration: number, maxRate: number): Promise<void> {
  console.log(`\n🏦 Requesting ${amount} USDC loan for ${duration} days...\n`);
  
  const connection = getConnection();
  const wallet = loadOrCreateWallet();
  
  // Set up Anchor provider
  const anchorWallet = new Wallet(wallet);
  const provider = new AnchorProvider(connection, anchorWallet, {
    commitment: 'confirmed',
    preflightCommitment: 'confirmed',
  });
  anchor.setProvider(provider);
  
  // Load IDLs
  const reputationIdl = loadIdl('reputation');
  const creditMarketIdl = loadIdl('credit_market');
  
  // Create program instances (Anchor 0.29.x API)
  const reputationProgram = new Program(reputationIdl as any, REPUTATION_PROGRAM_ID, provider);
  const creditMarketProgram = new Program(creditMarketIdl as any, CREDIT_MARKET_PROGRAM_ID, provider);
  
  try {
    // Step 1: Check/Create Reputation Profile
    console.log('📋 Checking reputation profile...');
    
    // Derive the profile PDA
    const [profilePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('agent_profile'), wallet.publicKey.toBuffer()],
      REPUTATION_PROGRAM_ID
    );
    
    // Check if profile exists
    let profileExists = false;
    try {
      const profileAccount = await (reputationProgram.account as any).agentProfile.fetch(profilePda);
      profileExists = true;
      console.log(`✓ Reputation profile found. Score: ${profileAccount.score}`);
    } catch (e) {
      profileExists = false;
    }
    
    // Create profile if it doesn't exist
    if (!profileExists) {
      console.log('📝 Creating reputation profile...');
      
      const registerTx = await reputationProgram.methods
        .registerAgent()
        .accounts({
          wallet: wallet.publicKey,
          profile: profilePda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      console.log(`✓ Profile created. Tx: ${registerTx}`);
      
      // Wait for confirmation
      await connection.confirmTransaction(registerTx, 'confirmed');
    }
    
    // Step 2: Create Borrow Request
    console.log('\n📄 Creating borrow request...');
    
    // Convert amount to USDC base units (6 decimals)
    const amountBn = new BN(amount * Math.pow(10, USDC_DECIMALS));
    
    // Convert duration from days to seconds
    const durationSecs = new BN(duration * 24 * 60 * 60);
    
    // maxRate is already in basis points (e.g., 1500 = 15%)
    const maxRateBps = maxRate;
    
    // Derive the borrow request PDA
    const [requestPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('borrow_request'), wallet.publicKey.toBuffer()],
      CREDIT_MARKET_PROGRAM_ID
    );
    
    console.log(`  Amount: ${amount} USDC (${amountBn.toString()} base units)`);
    console.log(`  Duration: ${duration} days (${durationSecs.toString()} seconds)`);
    console.log(`  Max Rate: ${maxRateBps / 100}% APY (${maxRateBps} bps)`);
    console.log(`  Borrower: ${wallet.publicKey.toBase58()}`);
    console.log(`  Request PDA: ${requestPda.toBase58()}`);
    
    // Call postBorrowRequest instruction
    const borrowTx = await creditMarketProgram.methods
      .postBorrowRequest(amountBn, maxRateBps, durationSecs)
      .accounts({
        borrower: wallet.publicKey,
        request: requestPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    
    console.log('\n✅ Borrow request created successfully!');
    console.log(`📝 Transaction signature: ${borrowTx}`);
    console.log(`🔗 View on Solana Explorer: https://explorer.solana.com/tx/${borrowTx}?cluster=devnet`);
    
    // Fetch and display the created request
    try {
      const requestAccount = await (creditMarketProgram.account as any).borrowRequest.fetch(requestPda);
      console.log('\n━━━ Borrow Request Details ━━━');
      console.log(`  Borrower: ${requestAccount.borrower.toBase58()}`);
      console.log(`  Amount: ${formatUsdc(requestAccount.amount)} USDC`);
      console.log(`  Max Rate: ${requestAccount.maxRateBps / 100}% APY`);
      console.log(`  Duration: ${Number(requestAccount.durationSecs) / (24 * 60 * 60)} days`);
      console.log(`  Status: ${requestAccount.isActive ? 'Active' : 'Inactive'}`);
    } catch (e) {
      // Non-critical, just for display
    }
    
  } catch (error: any) {
    console.error('\n❌ Borrow request failed:');
    
    if (error.logs) {
      console.error('\nProgram logs:');
      error.logs.forEach((log: string) => console.error(`  ${log}`));
    }
    
    if (error.message) {
      console.error(`\nError: ${error.message}`);
    }
    
    // Check for common errors
    if (error.message?.includes('insufficient funds') || error.message?.includes('0x1') || 
        error.message?.includes('no record of a prior credit')) {
      console.error('\n💡 Tip: You need SOL for transaction fees.');
      console.error('   Run: pln activate (to request airdrop)');
      console.error('   Or fund your wallet manually: ' + wallet.publicKey.toBase58());
    } else if (error.message?.includes('already in use') || error.message?.includes('already been processed')) {
      console.error('\n💡 Tip: You may already have an active borrow request.');
      console.error('   Use: pln status (to check your current requests)');
    }
    
    // Don't re-throw to provide cleaner output
    process.exit(1);
  }
}

// IDL types for account deserialization
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

// Load IDL files with program address injection (required for Anchor 0.30+)
function loadIdl(name: string): any {
  const idlPath = path.join(__dirname, '..', 'idl', `${name}.json`);
  const idl = JSON.parse(fs.readFileSync(idlPath, 'utf-8'));
  
  // Inject program address if not present
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

// Get PDA for reputation profile
function getReputationProfilePda(wallet: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('agent_profile'), wallet.toBuffer()],
    REPUTATION_PROGRAM_ID
  );
}

// Get PDA for lender position
function getLenderPositionPda(wallet: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('lender_position'), wallet.toBuffer()],
    LIQUIDITY_ROUTER_PROGRAM_ID
  );
}

// Get PDA for loan by ID
function getLoanPda(loanId: BN): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('loan'), loanId.toArrayLike(Buffer, 'le', 8)],
    CREDIT_MARKET_PROGRAM_ID
  );
}

async function status(): Promise<void> {
  console.log('\n📊 PLN Portfolio Status\n');
  
  const connection = getConnection();
  const wallet = loadOrCreateWallet();
  
  console.log(`Wallet: ${wallet.publicKey.toBase58()}`);
  console.log('Network: Solana Devnet\n');
  
  // SOL Balance
  const solBalance = await connection.getBalance(wallet.publicKey);
  console.log(`SOL Balance: ${(solBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
  
  // USDC Balance
  const usdcBalance = await getUsdcBalance(connection, wallet.publicKey);
  console.log(`USDC Balance: ${usdcBalance.toFixed(2)} USDC`);
  
  // Create provider for Anchor
  const anchorWallet = new Wallet(wallet);
  const provider = new AnchorProvider(connection, anchorWallet, {
    commitment: 'confirmed',
  });
  
  // ━━━ Reputation ━━━
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📈 REPUTATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const reputationIdl = loadIdl('reputation');
    const reputationProgram = new Program(reputationIdl as any, REPUTATION_PROGRAM_ID, provider);
    
    const [profilePda] = getReputationProfilePda(wallet.publicKey);
    const profile = await (reputationProgram.account as any).agentProfile.fetch(profilePda) as AgentProfile;
    
    console.log(`  Score:           ${profile.score} / 1000`);
    console.log(`  Loans Taken:     ${profile.loansTaken}`);
    console.log(`  Loans Repaid:    ${profile.loansRepaid}`);
    console.log(`  Loans Defaulted: ${profile.loansDefaulted}`);
    console.log(`  Total Borrowed:  ${formatUsdc(profile.totalBorrowed)} USDC`);
    console.log(`  Total Repaid:    ${formatUsdc(profile.totalRepaid)} USDC`);
    console.log(`  Total Lent:      ${formatUsdc(profile.totalLent)} USDC`);
  } catch (e: any) {
    if (e.message?.includes('Account does not exist') || e.toString().includes('Account does not exist')) {
      console.log('  No reputation profile found.');
      console.log('  → Register with: pln register');
    } else {
      console.log(`  Error fetching reputation: ${e.message || e}`);
    }
  }
  
  // ━━━ Lender Position (Liquidity Router) ━━━
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💰 LENDER POSITION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const routerIdl = loadIdl('liquidity_router');
    const routerProgram = new Program(routerIdl as any, LIQUIDITY_ROUTER_PROGRAM_ID, provider);
    
    const [positionPda] = getLenderPositionPda(wallet.publicKey);
    const position = await (routerProgram.account as any).lenderPosition.fetch(positionPda) as LenderPosition;
    
    const totalDeposited = position.totalDeposited.toNumber();
    const inKamino = position.inKamino.toNumber();
    const inP2p = position.inP2p.toNumber();
    
    console.log(`  Total Deposited: ${formatUsdc(totalDeposited)} USDC`);
    console.log(`  ├─ In Kamino:    ${formatUsdc(inKamino)} USDC`);
    console.log(`  └─ In P2P Loans: ${formatUsdc(inP2p)} USDC`);
    console.log(`  Min P2P Rate:    ${(position.minP2pRateBps / 100).toFixed(2)}% APY`);
    console.log(`  Kamino Buffer:   ${(position.kaminoBufferBps / 100).toFixed(2)}%`);
    console.log(`  Auto-Route:      ${position.autoRoute ? 'Enabled ✓' : 'Disabled'}`);
  } catch (e: any) {
    if (e.message?.includes('Account does not exist') || e.toString().includes('Account does not exist')) {
      console.log('  No lender position found.');
      console.log('  → Start lending with: pln deposit --amount <USDC>');
    } else {
      console.log(`  Error fetching position: ${e.message || e}`);
    }
  }
  
  // ━━━ Active Loans (Credit Market) ━━━
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🏦 ACTIVE LOANS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const creditIdl = loadIdl('credit_market');
    const creditProgram = new Program(creditIdl as any, CREDIT_MARKET_PROGRAM_ID, provider);
    
    // Fetch all Loan accounts where user is the borrower
    const borrowerLoans = await (creditProgram.account as any).loan.all([
      {
        memcmp: {
          offset: 8 + 8 + 32, // discriminator + id + lender = offset to borrower
          bytes: wallet.publicKey.toBase58(),
        },
      },
    ]);
    
    // Fetch all Loan accounts where user is the lender
    const lenderLoans = await (creditProgram.account as any).loan.all([
      {
        memcmp: {
          offset: 8 + 8, // discriminator + id = offset to lender
          bytes: wallet.publicKey.toBase58(),
        },
      },
    ]);
    
    const activeAsBorowwer = borrowerLoans.filter((l) => {
      const loan = l.account as unknown as Loan;
      return 'active' in loan.status;
    });
    
    const activeAsLender = lenderLoans.filter((l) => {
      const loan = l.account as unknown as Loan;
      return 'active' in loan.status;
    });
    
    if (activeAsBorowwer.length === 0 && activeAsLender.length === 0) {
      console.log('  No active loans.');
      console.log('  → Borrow with: pln borrow --amount <USDC>');
    } else {
      if (activeAsBorowwer.length > 0) {
        console.log('\n  As Borrower:');
        for (const l of activeAsBorowwer) {
          const loan = l.account as unknown as Loan;
          const endDate = new Date(loan.endTime.toNumber() * 1000);
          const now = Date.now();
          const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now) / (1000 * 60 * 60 * 24)));
          
          console.log(`  ┌─ Loan #${loan.id.toString()}`);
          console.log(`  │  Principal:  ${formatUsdc(loan.principal)} USDC`);
          console.log(`  │  Rate:       ${(loan.rateBps / 100).toFixed(2)}% APY`);
          console.log(`  │  Due:        ${endDate.toLocaleDateString()} (${daysLeft} days left)`);
          console.log(`  │  Lender:     ${loan.lender.toBase58().slice(0, 8)}...`);
          console.log(`  └─ PDA:        ${l.publicKey.toBase58().slice(0, 8)}...`);
        }
      }
      
      if (activeAsLender.length > 0) {
        console.log('\n  As Lender:');
        for (const l of activeAsLender) {
          const loan = l.account as unknown as Loan;
          const endDate = new Date(loan.endTime.toNumber() * 1000);
          const now = Date.now();
          const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now) / (1000 * 60 * 60 * 24)));
          
          console.log(`  ┌─ Loan #${loan.id.toString()}`);
          console.log(`  │  Principal:  ${formatUsdc(loan.principal)} USDC`);
          console.log(`  │  Rate:       ${(loan.rateBps / 100).toFixed(2)}% APY`);
          console.log(`  │  Due:        ${endDate.toLocaleDateString()} (${daysLeft} days left)`);
          console.log(`  │  Borrower:   ${loan.borrower.toBase58().slice(0, 8)}...`);
          console.log(`  └─ PDA:        ${l.publicKey.toBase58().slice(0, 8)}...`);
        }
      }
    }
  } catch (e: any) {
    console.log(`  Error fetching loans: ${e.message || e}`);
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

async function repay(loanId: string, amount?: number): Promise<void> {
  console.log(`\n💸 Repaying loan ID ${loanId}...\n`);
  
  const connection = getConnection();
  const wallet = loadOrCreateWallet();
  
  // Set up Anchor provider
  const anchorWallet = new Wallet(wallet);
  const provider = new AnchorProvider(connection, anchorWallet, {
    commitment: 'confirmed',
    preflightCommitment: 'confirmed',
  });
  anchor.setProvider(provider);
  
  // Load IDLs
  const idlPath = path.join(__dirname, '..', 'idl');
  const creditMarketIdl = JSON.parse(
    fs.readFileSync(path.join(idlPath, 'credit_market.json'), 'utf-8')
  );
  
  const reputationIdl = JSON.parse(
    fs.readFileSync(path.join(idlPath, 'reputation.json'), 'utf-8')
  );
  
  // Create program instances (Program(idl, programId, provider))
  const creditMarketProgram = new Program(creditMarketIdl as any, CREDIT_MARKET_PROGRAM_ID, provider);
  const reputationProgram = new Program(reputationIdl as any, REPUTATION_PROGRAM_ID, provider);
  
  try {
    const loanIdBn = new BN(loanId);
    
    // Derive Loan PDA
    const [loanPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('loan'), loanIdBn.toArrayLike(Buffer, 'le', 8)],
      CREDIT_MARKET_PROGRAM_ID
    );
    
    console.log(`Loan PDA: ${loanPda.toBase58()}`);
    
    // Fetch loan account to get details
    let loanAccount: any;
    try {
      loanAccount = await (creditMarketProgram.account as any).loan.fetch(loanPda);
    } catch (e) {
      console.log(`❌ Loan not found with ID ${loanId}`);
      console.log('  Make sure the loan ID is correct and exists on devnet.');
      return;
    }
    
    // Verify the borrower
    if (!loanAccount.borrower.equals(wallet.publicKey)) {
      console.log('❌ You are not the borrower of this loan.');
      console.log(`  Loan borrower: ${loanAccount.borrower.toBase58()}`);
      console.log(`  Your wallet: ${wallet.publicKey.toBase58()}`);
      return;
    }
    
    // Check loan status
    if (!loanAccount.status.active) {
      console.log('❌ Loan is not active.');
      const statusStr = loanAccount.status.repaid ? 'Repaid' :
                        loanAccount.status.defaulted ? 'Defaulted' :
                        loanAccount.status.liquidated ? 'Liquidated' : 'Unknown';
      console.log(`  Current status: ${statusStr}`);
      return;
    }
    
    console.log('Loan Details:');
    console.log(`  Principal: ${formatUsdc(loanAccount.principal)} USDC`);
    console.log(`  Rate: ${loanAccount.rateBps / 100}% APY`);
    console.log(`  Lender: ${loanAccount.lender.toBase58().slice(0, 8)}...`);
    
    // Calculate repayment amount (principal + interest)
    const now = Math.floor(Date.now() / 1000);
    const elapsed = now - loanAccount.startTime.toNumber();
    const interestAmount = loanAccount.principal.toNumber() * 
      (loanAccount.rateBps / 10000) * 
      (elapsed / (365 * 24 * 60 * 60));
    const totalRepayment = Math.ceil(loanAccount.principal.toNumber() + interestAmount);
    
    console.log(`  Interest accrued: ~${formatUsdc(interestAmount)} USDC`);
    console.log(`  Total repayment: ~${formatUsdc(totalRepayment)} USDC`);
    
    // Check borrower's USDC balance
    const borrowerUsdcAta = await getAssociatedTokenAddress(
      USDC_MINT,
      wallet.publicKey
    );
    
    const usdcBalance = await getUsdcBalance(connection, wallet.publicKey);
    if (usdcBalance * Math.pow(10, USDC_DECIMALS) < totalRepayment) {
      console.log(`\n❌ Insufficient USDC balance.`);
      console.log(`  Required: ~${formatUsdc(totalRepayment)} USDC`);
      console.log(`  Available: ${usdcBalance.toFixed(2)} USDC`);
      return;
    }
    
    // Get lender's USDC ATA
    const lenderUsdcAta = await getAssociatedTokenAddress(
      USDC_MINT,
      loanAccount.lender
    );
    
    console.log('\nSubmitting repay transaction...');
    
    // Call repayLoan on Credit Market
    const repayTx = await creditMarketProgram.methods
      .repayLoan(loanIdBn)
      .accounts({
        borrower: wallet.publicKey,
        loan: loanPda,
        borrowerUsdc: borrowerUsdcAta,
        lenderUsdc: lenderUsdcAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
    
    console.log(`✓ Loan repaid! Tx: ${repayTx}`);
    console.log(`  https://explorer.solana.com/tx/${repayTx}?cluster=devnet`);
    
    // Update reputation
    console.log('\nUpdating reputation...');
    
    // Derive borrower profile PDA
    const [profilePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('agent_profile'), wallet.publicKey.toBuffer()],
      REPUTATION_PROGRAM_ID
    );
    
    // Check if profile exists
    let profileExists = false;
    try {
      await (reputationProgram.account as any).agentProfile.fetch(profilePda);
      profileExists = true;
    } catch {
      profileExists = false;
    }
    
    if (profileExists) {
      try {
        const repAmountBn = new BN(totalRepayment);
        const reputationTx = await reputationProgram.methods
          .recordRepayment(repAmountBn)
          .accounts({
            profile: profilePda,
            authority: wallet.publicKey,
          })
          .rpc();
        
        console.log(`✓ Reputation updated! Tx: ${reputationTx}`);
        console.log(`  https://explorer.solana.com/tx/${reputationTx}?cluster=devnet`);
      } catch (e: any) {
        console.log(`⚠ Could not update reputation: ${e.message}`);
        console.log('  (Loan was still repaid successfully)');
      }
    } else {
      console.log('⚠ No reputation profile found. Skipping reputation update.');
      console.log('  Run "pln activate" to create your profile first.');
    }
    
    console.log('\n✅ Repayment complete!');
    
  } catch (e: any) {
    console.log(`\n❌ Repayment failed: ${e.message}`);
    
    // Parse Anchor errors
    if (e.logs) {
      const errorLog = e.logs.find((log: string) => log.includes('Error'));
      if (errorLog) {
        console.log(`  Log: ${errorLog}`);
      }
    }
    
    // Common error hints
    if (e.message.includes('LoanNotActive')) {
      console.log('  Hint: The loan may already be repaid or liquidated.');
    } else if (e.message.includes('Unauthorized')) {
      console.log('  Hint: You are not authorized to repay this loan.');
    } else if (e.message.includes('insufficient')) {
      console.log('  Hint: Check your USDC balance.');
    }
  }
}

async function report(frequency: 'daily' | 'weekly' | 'monthly'): Promise<void> {
  const config = loadConfig();
  config.reportFrequency = frequency;
  saveConfig(config);
  
  console.log(`\n✓ Portfolio reports set to: ${frequency}`);
  console.log('  You will receive updates in chat.\n');
}

// ============ CLI Parser ============

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command) {
    console.log('PLN CLI - PATH Liquidity Network');
    console.log('\nUsage: pln-cli.ts <command> [options]');
    console.log('\nCommands:');
    console.log('  activate              Initialize wallet and get devnet funds');
    console.log('  deposit --amount N    Deposit N USDC to earn yield');
    console.log('  borrow --amount N     Borrow N USDC against reputation');
    console.log('  status                Check portfolio status');
    console.log('  repay --loan ID       Repay an active loan by loan ID');
    console.log('  report --frequency F  Set report frequency (daily/weekly/monthly)');
    return;
  }
  
  // Parse arguments
  const getArg = (name: string): string | undefined => {
    const idx = args.indexOf(`--${name}`);
    return idx !== -1 ? args[idx + 1] : undefined;
  };
  
  switch (command) {
    case 'activate':
      await activate();
      break;
      
    case 'deposit':
      const depositAmount = parseFloat(getArg('amount') || '0');
      if (depositAmount <= 0) {
        console.log('Error: --amount is required and must be > 0');
        return;
      }
      await deposit(depositAmount);
      break;
      
    case 'borrow':
      const borrowAmount = parseFloat(getArg('amount') || '0');
      const duration = parseInt(getArg('duration') || '7');
      const maxRate = parseInt(getArg('max-rate') || '1500');
      if (borrowAmount <= 0) {
        console.log('Error: --amount is required and must be > 0');
        return;
      }
      await borrow(borrowAmount, duration, maxRate);
      break;
      
    case 'status':
      await status();
      break;
      
    case 'repay':
      const loanId = getArg('loan') || getArg('id');
      if (!loanId) {
        console.log('Error: --loan (or --id) is required');
        console.log('Usage: pln repay --loan <LOAN_ID> [--amount <USDC>]');
        return;
      }
      const repayAmount = getArg('amount') ? parseFloat(getArg('amount')!) : undefined;
      await repay(loanId, repayAmount);
      break;
      
    case 'report':
      const freq = getArg('frequency') as 'daily' | 'weekly' | 'monthly';
      if (!['daily', 'weekly', 'monthly'].includes(freq)) {
        console.log('Error: --frequency must be daily, weekly, or monthly');
        return;
      }
      await report(freq);
      break;
      
    default:
      console.log(`Unknown command: ${command}`);
      console.log('Run without arguments to see available commands.');
  }
}

main().catch(console.error);
