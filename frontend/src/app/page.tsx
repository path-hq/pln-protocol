import Link from 'next/link';
import { TrendingUp, Wallet, ArrowLeftRight, DollarSign, Users, Activity } from 'lucide-react';
import StatsCard from '@/components/StatsCard';
import RoutingFeed from '@/components/RoutingFeed';

export default function OverviewPage() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-8">
        <h1 className="text-4xl font-bold text-white sm:text-5xl">
          PATH Liquidity Network
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-[#71717a]">
          Agentic liquidity network on Solana. Lend capital to earn optimized yield, or borrow to amplify your trading strategies.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Value Locked"
          value="$12.4M"
          change="8.2%"
          changeType="positive"
          icon={DollarSign}
        />
        <StatsCard
          title="Active Loans"
          value="$3.8M"
          change="12.5%"
          changeType="positive"
          icon={Activity}
        />
        <StatsCard
          title="Active Agents"
          value="247"
          change="23"
          changeType="positive"
          icon={Users}
        />
        <StatsCard
          title="Avg APY"
          value="14.2%"
          change="1.3%"
          changeType="positive"
          icon={TrendingUp}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Routing Feed - takes 2 columns */}
        <div className="lg:col-span-2">
          <RoutingFeed />
        </div>

        {/* CTAs - takes 1 column */}
        <div className="space-y-4">
          <Link href="/lend">
            <div className="group rounded-xl border border-[#1f1f24] bg-[#0f0f12] p-6 transition-all hover:border-[#22c55e]/50 hover:bg-[#22c55e]/5 cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="rounded-lg bg-[#22c55e]/10 p-3 group-hover:bg-[#22c55e]/20">
                  <Wallet className="h-6 w-6 text-[#22c55e]" />
                </div>
                <ArrowLeftRight className="h-5 w-5 text-[#71717a] group-hover:text-[#22c55e] transition-colors" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white group-hover:text-[#22c55e] transition-colors">
                Start Lending
              </h3>
              <p className="mt-1 text-sm text-[#71717a]">
                Deposit capital into PLN and earn yield from agent borrowers. Choose your risk profile.
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm text-[#22c55e]">
                <span>View Lend Dashboard</span>
                <ArrowLeftRight className="h-4 w-4" />
              </div>
            </div>
          </Link>

          <Link href="/borrow">
            <div className="group rounded-xl border border-[#1f1f24] bg-[#0f0f12] p-6 transition-all hover:border-blue-500/50 hover:bg-blue-500/5 cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="rounded-lg bg-blue-500/10 p-3 group-hover:bg-blue-500/20">
                  <TrendingUp className="h-6 w-6 text-blue-500" />
                </div>
                <ArrowLeftRight className="h-5 w-5 text-[#71717a] group-hover:text-blue-500 transition-colors" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white group-hover:text-blue-500 transition-colors">
                Start Borrowing
              </h3>
              <p className="mt-1 text-sm text-[#71717a]">
                Access credit based on your agent's reputation and trading history.
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm text-blue-500">
                <span>View Borrow Dashboard</span>
                <ArrowLeftRight className="h-4 w-4" />
              </div>
            </div>
          </Link>

          <Link href="/my-reputation">
            <div className="group rounded-xl border border-[#1f1f24] bg-[#0f0f12] p-6 transition-all hover:border-purple-500/50 hover:bg-purple-500/5 cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="rounded-lg bg-purple-500/10 p-3 group-hover:bg-purple-500/20">
                  <Users className="h-6 w-6 text-purple-500" />
                </div>
                <ArrowLeftRight className="h-5 w-5 text-[#71717a] group-hover:text-purple-500 transition-colors" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white group-hover:text-purple-500 transition-colors">
                My Reputation
              </h3>
              <p className="mt-1 text-sm text-[#71717a]">
                View your on-chain credit score and trading performance.
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm text-purple-500">
                <span>Check Score</span>
                <ArrowLeftRight className="h-4 w-4" />
              </div>
            </div>
          </Link>

          <Link href="/register-identity">
            <div className="group rounded-xl border border-[#1f1f24] bg-[#0f0f12] p-6 transition-all hover:border-yellow-500/50 hover:bg-yellow-500/5 cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="rounded-lg bg-yellow-500/10 p-3 group-hover:bg-yellow-500/20">
                  <Activity className="h-6 w-6 text-yellow-500" />
                </div>
                <ArrowLeftRight className="h-5 w-5 text-[#71717a] group-hover:text-yellow-500 transition-colors" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white group-hover:text-yellow-500 transition-colors">
                Register Agent Identity
              </h3>
              <p className="mt-1 text-sm text-[#71717a]">
                Create your unique .sol agent identity and build on-chain credit.
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm text-yellow-500">
                <span>Start Now</span>
                <ArrowLeftRight className="h-4 w-4" />
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid gap-4 sm:grid-cols-3 pt-8">
        <div className="rounded-xl border border-[#1f1f24] bg-[#0f0f12] p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#22c55e]/10">
            <Activity className="h-6 w-6 text-[#22c55e]" />
          </div>
          <h3 className="mt-4 font-medium text-white">Real-time Monitoring</h3>
          <p className="mt-2 text-sm text-[#71717a]">
            Track agent performance and loan health in real-time
          </p>
        </div>
        <div className="rounded-xl border border-[#1f1f24] bg-[#0f0f12] p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#22c55e]/10">
            <Users className="h-6 w-6 text-[#22c55e]" />
          </div>
          <h3 className="mt-4 font-medium text-white">Reputation Based</h3>
          <p className="mt-2 text-sm text-[#71717a]">
            Credit limits based on proven trading performance
          </p>
        </div>
        <div className="rounded-xl border border-[#1f1f24] bg-[#0f0f12] p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#22c55e]/10">
            <DollarSign className="h-6 w-6 text-[#22c55e]" />
          </div>
          <h3 className="mt-4 font-medium text-white">Competitive Yields</h3>
          <p className="mt-2 text-sm text-[#71717a]">
            Earn attractive returns from verified trading agents via PLN
          </p>
        </div>
      </div>
    </div>
  );
}
