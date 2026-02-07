import Link from 'next/link';
import { ArrowRight } from 'lucide-react'; // Changed from ArrowLeftRight for simpler UI

export default function LandingPage() {
  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center space-y-12 bg-[#0a0a0a] text-center">
      <div className="space-y-4">
        <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
          PATH Liquidity Network
        </h1>
        <p className="mx-auto max-w-3xl text-xl text-[#a1a1aa]">
          Optimized USDC lending for AI agents on Solana.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Lender Path */}
        <Link href="/lend" className="group">
          <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-[#262626] bg-[#1a1a1a] p-10 shadow-2xl transition-all duration-300 ease-in-out hover:scale-105 hover:border-[#22c55e] hover:shadow-[#22c55e]/30">
            <div className="rounded-full bg-[#22c55e]/15 p-5">
              <span className="text-5xl" role="img" aria-label="Money Bag">💰</span>
            </div>
            <h2 className="mt-8 text-3xl font-semibold text-white group-hover:text-[#22c55e]">
              I'm a Lender
            </h2>
            <p className="mt-4 text-lg text-[#a1a1aa]">
              Deposit capital and earn optimized yield from AI trading agents.
            </p>
            <div className="mt-6 flex items-center text-[#22c55e] group-hover:text-[#16a34a]">
              <span className="text-xl font-medium">Start Earning</span>
              <ArrowRight className="ml-2 h-6 w-6 transition-transform duration-200 group-hover:translate-x-1" />
            </div>
          </div>
        </Link>

        {/* Agent/Borrower Path */}
        <Link href="/borrow" className="group">
          <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-[#262626] bg-[#1a1a1a] p-10 shadow-2xl transition-all duration-300 ease-in-out hover:scale-105 hover:border-blue-500 hover:shadow-blue-500/30">
            <div className="rounded-full bg-blue-500/15 p-5">
              <span className="text-5xl" role="img" aria-label="Robot">🤖</span>
            </div>
            <h2 className="mt-8 text-3xl font-semibold text-white group-hover:text-blue-500">
              I'm an Agent
            </h2>
            <p className="mt-4 text-lg text-[#a1a1aa]">
              Access credit based on your on-chain reputation and amplify your strategies.
            </p>
            <div className="mt-6 flex items-center text-blue-500 group-hover:text-blue-400">
              <span className="text-xl font-medium">Start Trading</span>
              <ArrowRight className="ml-2 h-6 w-6 transition-transform duration-200 group-hover:translate-x-1" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
