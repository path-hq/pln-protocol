'use client';

import { useState } from 'react';
import { Search, User, Award, TrendingUp, Wallet, CheckCircle, Shield } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import { usePLNPrograms } from '@/hooks/usePLNPrograms';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import * as anchor from '@coral-xyz/anchor';
import { Buffer } from 'buffer';

interface AgentProfile {
  wallet: PublicKey;
  loans_taken: BN;
  loans_repaid: BN;
  loans_defaulted: BN;
  total_borrowed: BN;
  total_repaid: BN;
  total_lent: BN;
  score: BN;
  created_at: BN;
  updated_at: BN;
  bump: number;
}

export default function AgentIdentityPage() {
  const [searchAgent, setSearchAgent] = useState('');
  const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { reputation: reputationProgram, provider } = usePLNPrograms();

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setAgentProfile(null);

    if (!searchAgent) {
      setError("Please enter an agent name or Public Key.");
      setLoading(false);
      return;
    }

    try {
      let agentPublicKey: PublicKey;
      try {
        agentPublicKey = new PublicKey(searchAgent);
      } catch (e) {
        setError("Invalid Public Key format.");
        setLoading(false);
        return;
      }

      if (!reputationProgram) {
        setError("Reputation program not initialized.");
        setLoading(false);
        return;
      }

      const [profilePDA] = PublicKey.findProgramAddressSync(
        [
          anchor.utils.bytes.utf8.encode("agent_profile"),
          agentPublicKey.toBuffer(),
        ],
        new PublicKey('7UkU7PFm4eNYoTT5pe3kCFYvVfahKe8oZH6W2pkaxCZY') // Reputation Program ID
      );

      const profile = await reputationProgram.account.agentProfile.fetch(profilePDA);
      setAgentProfile(profile as unknown as AgentProfile);

    } catch (err: any) {
      console.error("Error fetching agent profile:", err);
      setError(`Failed to fetch profile: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-bold text-white">Agent Identity Dashboard</h1>
        <p className="text-[#71717a]">Search for agent .sol names and view their on-chain reputation.</p>
      </div>

      {/* Search Input */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#71717a]" />
          <input
            type="text"
            value={searchAgent}
            onChange={(e) => setSearchAgent(e.target.value)}
            placeholder="Search agent .sol name or Public Key..."
            className="w-full rounded-lg border border-[#1f1f24] bg-[#0f0f12] py-2 pl-10 pr-4 text-white placeholder-[#71717a] focus:border-blue-500 focus:outline-none"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="rounded-lg bg-blue-500 px-6 py-2 font-medium text-black hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && (
        <div className="mx-auto max-w-md p-4 bg-red-800/20 text-red-400 rounded-lg">
          <p>{error}</p>
        </div>
      )}

      {agentProfile && (
        <div className="mx-auto max-w-3xl rounded-xl border border-[#1f1f24] bg-[#0f0f12] p-6 space-y-6 mt-8">
          <div className="flex items-center gap-4">
            <User className="h-8 w-8 text-blue-500" />
            <div>
              <h2 className="text-xl font-bold text-white">Agent Profile</h2>
              <p className="text-sm text-[#71717a]">{agentProfile.wallet.toBase58()}</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <StatsCard
              title="Reputation Score"
              value={`${agentProfile.score.toNumber()}/1000`}
              icon={Award}
              changeType={agentProfile.score.toNumber() >= 500 ? 'positive' : 'negative'}
            />
            <StatsCard
              title="Loans Repaid"
              value={agentProfile.loans_repaid.toNumber().toString()}
              icon={CheckCircle}
              changeType={agentProfile.loans_repaid.toNumber() > 0 ? 'positive' : 'negative'}
            />
            <StatsCard
              title="Loans Taken"
              value={agentProfile.loans_taken.toNumber().toString()}
              icon={TrendingUp}
            />
            <StatsCard
              title="Total Borrowed"
              value={`$${(agentProfile.total_borrowed.toNumber() / (10 ** 6)).toFixed(2)}`}
              icon={Wallet}
            />
            <StatsCard
              title="Total Repaid"
              value={`$${(agentProfile.total_repaid.toNumber() / (10 ** 6)).toFixed(2)}`}
              icon={Wallet}
            />
            <StatsCard
              title="Defaults"
              value={agentProfile.loans_defaulted.toNumber().toString()}
              icon={Shield}
              changeType={agentProfile.loans_defaulted.toNumber() === 0 ? 'positive' : 'negative'}
            />
          </div>

          <div className="text-sm text-[#71717a]">
            <p>Created: {new Date(agentProfile.created_at.toNumber() * 1000).toLocaleString()}</p>
            <p>Last Updated: {new Date(agentProfile.updated_at.toNumber() * 1000).toLocaleString()}</p>
          </div>
        </div>
      )}

      {!agentProfile && !loading && !error && (
        <div className="mx-auto max-w-md p-6 bg-[#0f0f12] border border-[#1f1f24] rounded-lg text-center text-[#71717a]">
          Enter an agent's Public Key above to view their on-chain identity and reputation.
        </div>
      )}
    </div>
  );
}
