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
    positive: 'text-[#00FFB8]',
    negative: 'text-red-500',
    neutral: 'text-[#888888]',
  };

  return (
    <div className="rounded-xl border border-[#222222] bg-[#111111] p-6 transition-all hover:border-[#00FFB8]/30">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[#888888]">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
          {change && (
            <p className={`mt-1 text-sm ${changeColor[changeType]}`}>
              {changeType === 'positive' && '+'}{change}
            </p>
          )}
        </div>
        <div className="rounded-lg bg-[#00FFB8]/10 p-3">
          <Icon className="h-5 w-5 text-[#00FFB8]" />
        </div>
      </div>
    </div>
  );
}
