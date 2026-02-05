import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
}

export default function StatsCard({ title, value, change, changeType = 'neutral', icon: Icon }: StatsCardProps) {
  const changeColor = {
    positive: 'text-[#22c55e]',
    negative: 'text-red-500',
    neutral: 'text-[#71717a]',
  };

  return (
    <div className="rounded-xl border border-[#1f1f24] bg-[#0f0f12] p-6 transition-all hover:border-[#22c55e]/30">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[#71717a]">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
          {change && (
            <p className={`mt-1 text-sm ${changeColor[changeType]}`}>
              {changeType === 'positive' && '+'}{change}
            </p>
          )}
        </div>
        <div className="rounded-lg bg-[#22c55e]/10 p-3">
          <Icon className="h-5 w-5 text-[#22c55e]" />
        </div>
      </div>
    </div>
  );
}
