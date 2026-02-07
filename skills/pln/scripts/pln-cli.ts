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
  
  // TODO: Implement actual deposit transaction using Liquidity Router program
  // This would involve:
  // 1. Creating/loading the Liquidity Router program
  // 2. Finding the lender position PDA
  // 3. Calling the deposit instruction
  
  console.log('⚠ Deposit transaction not yet implemented.');
  console.log('  The Liquidity Router program needs to be integrated.');
  console.log(`\n  Would deposit ${amount} USDC from wallet ${wallet.publicKey.toBase58().slice(0, 8)}...`);
  console.log('\n  Contract: ' + LIQUIDITY_ROUTER_PROGRAM_ID.toBase58());
}

async function borrow(amount: number, duration: number, maxRate: number): Promise<void> {
  console.log(`\n🏦 Requesting ${amount} USDC loan for ${duration} days...\n`);
  
  const connection = getConnection();
  const wallet = loadOrCreateWallet();
  
  // TODO: Implement actual borrow transaction using Credit Market program
  // This would involve:
  // 1. Checking reputation score
  // 2. Finding available lend offers
  // 3. Calling the borrow instruction
  
  console.log('⚠ Borrow transaction not yet implemented.');
  console.log('  The Credit Market program needs to be integrated.');
  console.log(`\n  Would borrow ${amount} USDC at max ${maxRate / 100}% APY`);
  console.log(`  Duration: ${duration} days`);
  console.log(`  Borrower: ${wallet.publicKey.toBase58().slice(0, 8)}...`);
  console.log('\n  Contract: ' + CREDIT_MARKET_PROGRAM_ID.toBase58());
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
  
  // TODO: Fetch reputation score from Reputation program
  console.log('\n━━━ Reputation ━━━');
  console.log('Score: Not yet fetched (program integration needed)');
  console.log('Contract: ' + REPUTATION_PROGRAM_ID.toBase58());
  
  // TODO: Fetch active deposits from Liquidity Router
  console.log('\n━━━ Deposits ━━━');
  console.log('Active Deposits: Not yet fetched');
  console.log('Contract: ' + LIQUIDITY_ROUTER_PROGRAM_ID.toBase58());
  
  // TODO: Fetch active loans from Credit Market
  console.log('\n━━━ Loans ━━━');
  console.log('Active Loans: Not yet fetched');
  console.log('Contract: ' + CREDIT_MARKET_PROGRAM_ID.toBase58());
  
  console.log('\n');
}

async function repay(loanPubkey: string): Promise<void> {
  console.log(`\n💸 Repaying loan ${loanPubkey.slice(0, 8)}...\n`);
  
  // TODO: Implement actual repay transaction using Credit Market program
  
  console.log('⚠ Repay transaction not yet implemented.');
  console.log('  The Credit Market program needs to be integrated.');
  console.log('\n  Contract: ' + CREDIT_MARKET_PROGRAM_ID.toBase58());
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
    console.log('  repay --loan PUBKEY   Repay an active loan');
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
      const loanPubkey = getArg('loan');
      if (!loanPubkey) {
        console.log('Error: --loan is required');
        return;
      }
      await repay(loanPubkey);
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
