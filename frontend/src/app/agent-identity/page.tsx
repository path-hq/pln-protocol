import { useState } from 'react';
import { Search, User, Award, TrendingUp, Wallet, CheckCircle } from 'lucide-react';
import { usePLNPrograms } from '@/hooks/usePLNPrograms';
import { PublicKey } from '@solana/web3.js';

interface AgentProfile {
  wallet: PublicKey;
  loans_taken: number;
  loans_repaid: number;
  loans_defaulted: number;
  total_borrowed: number;
  total_repaid: number;
  total_lent: number;
  score: number;
  created_at: number;
  updated_at: number;
}

export default function AgentIdentityPage() {
  const [searchAgent, setSearchAgent] = useState('');
  const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { reputation, provider } = usePLNPrograms();

  const handleSearch = async () => {
    if (!reputation || !provider || !searchAgent) {
      setError("Wallet not connected, program not loaded, or no agent name entered.");
      return;
    }

    setLoading(true);
    setError(null);
    setAgentProfile(null);

    try {
      // This is a placeholder for resolving .sol names to PublicKey
      // For now, assume searchAgent is directly a PublicKey string for testing
      const agentPublicKey = new PublicKey(searchAgent);

      const [profilePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("profile"), agentPublicKey.toBuffer()],
        reputation.programId
      );

      const profileData = await reputation.account.agentProfile.fetch(profilePDA);
      setAgentProfile(profileData as AgentProfile);

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
              value={`${agentProfile.score}/1000`}
              icon={Award}
              changeType={agentProfile.score >= 500 ? 'positive' : 'negative'}
            />
            <StatsCard
              title="Loans Repaid"
              value={agentProfile.loans_repaid.toString()}
              icon={CheckCircle}
              changeType={agentProfile.loans_repaid > 0 ? 'positive' : 'negative'}
            />
            <StatsCard
              title="Loans Taken"
              value={agentProfile.loans_taken.toString()}
              icon={TrendingUp}
            />
            <StatsCard
              title="Total Borrowed"
              value={`$${(agentProfile.total_borrowed / (10 ** 6)).toFixed(2)}`}
              icon={DollarSign}
            />
            <StatsCard
              title="Total Repaid"
              value={`$${(agentProfile.total_repaid / (10 ** 6)).toFixed(2)}`}
              icon={Wallet}
            />
            <StatsCard
              title="Defaults"
              value={agentProfile.loans_defaulted.toString()}
              icon={AlertTriangle}
              changeType={agentProfile.loans_defaulted === 0 ? 'positive' : 'negative'}
            />
          </div>

          <div className="text-sm text-[#71717a]">
            <p>Created: {new Date(agentProfile.created_at * 1000).toLocaleString()}</p>
            <p>Last Updated: {new Date(agentProfile.updated_at * 1000).toLocaleString()}</p>
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
