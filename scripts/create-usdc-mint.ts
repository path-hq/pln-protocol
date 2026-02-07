
import { Connection, Keypair, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import 'dotenv/config';

async function createAndMintDevnetUsdc() {
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

    // Make sure we have a payer. In a real app, this would be a wallet.
    // For now, we'll use a new keypair or a loaded one.
    // Request Airdrop for payer (needed to cover transaction fees)
    const payer = Keypair.generate();
    console.log(`Payer Public Key: ${payer.publicKey.toBase58()}`);

    console.log(`Requesting SOL airdrop for payer: ${payer.publicKey.toBase58()}...`);
    const airdropSignature = await connection.requestAirdrop(
        payer.publicKey,
        2 * 1_000_000_000 // 2 SOL
    );
    await connection.confirmTransaction(airdropSignature, 'confirmed');
    console.log('Airdrop confirmed.');

    // The recipient will be Fares' Phantom wallet
    const recipientPublicKey = new PublicKey('C2bVaF3T1KNCRsDH3wAPo8sfmSwJZvBe2jepjbVoGq4M');

    // Step 1: Create a new mint
    console.log('Creating new SPL Token mint...');
    const mint = await createMint(
        connection,
        payer, // Payer of the transaction (a Keypair that can sign)
        payer.publicKey, // Mint Authority (a PublicKey, the owner of the mint)
        null, // Freeze Authority (optional, use null to disable it)
        6, // Decimals (USDC typically has 6 decimals)
        TOKEN_PROGRAM_ID as PublicKey // Explicitly cast to PublicKey
    );
    console.log(`New Devnet USDC Mint Address: ${mint.toBase58()}`);

    // Step 2: Get or create the recipient's Associated Token Account (ATA) for the new mint
    console.log(`Getting or creating recipient's ATA for ${recipientPublicKey.toBase58()}...`);
    const recipientATA = await getOrCreateAssociatedTokenAccount(
        connection,
        payer, // Payer of the transaction
        mint,
        recipientPublicKey // Owner of the ATA
    );
    console.log(`Recipient ATA: ${recipientATA.address.toBase58()}`);

    // Step 3: Mint 10,000 tokens to the recipient's ATA
    const amountToMint = 10_000 * (10 ** 6); // 10,000 tokens with 6 decimals
    console.log(`Minting ${amountToMint / (10 ** 6)} tokens to recipient ATA: ${recipientATA.address.toBase58()}...`);
    await mintTo(
        connection,
        payer, // Payer of the transaction
        mint,
        recipientATA.address,
        payer.publicKey, // Mint Authority (needs to be the PublicKey that owns the mint)
        amountToMint
    );
    console.log('Tokens minted successfully!');

    console.log(`
    -----------------------------------------------------
    Devnet USDC Setup Complete!
    Mint Address: ${mint.toBase58()}
    Recipient: ${recipientPublicKey.toBase58()}
    Amount Minted: ${amountToMint / (10 ** 6)}
    Please update your frontend .env.local with:
    NEXT_PUBLIC_DEVNET_USDC_MINT_ADDRESS='${mint.toBase58()}'
    -----------------------------------------------------
    `);
}

createAndMintDevnetUsdc().catch(err => {
    console.error(err);
});
