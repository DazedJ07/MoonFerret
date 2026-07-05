'use client';

import { Package, Archive, PackagePlus, AlertTriangle, type LucideIcon } from 'lucide-react';
import { metrics } from '@/data/mock-data';

interface MetricCardProps {
  icon: LucideIcon;
  value: number;
  label: string;
  accent?: string;
}

function MetricCard({ icon: Icon, value, label, accent }: MetricCardProps) {
  return (
    <div className="bg-card border border-border-main p-6 flex flex-col gap-3 hover:bg-header-accent/5 transition-colors duration-300">
      <div className={`w-10 h-10 rounded-none flex items-center justify-center border border-border-main/30 ${accent || 'bg-canvas'}`}>
        <Icon className="w-5 h-5" style={{ color: accent ? undefined : 'var(--text-secondary)' }} />
      </div>
      <div>
        <p className="text-3xl font-semibold tracking-tight text-primary">{value}</p>
        <p className="text-sm text-secondary mt-1 font-medium">{label}</p>
      </div>
    </div>
  );
}

export default function SummaryCards() {
  const cards: MetricCardProps[] = [
    {
      icon: Package,
      value: metrics.totalItems,
      label: 'Items Tracked',
      accent: 'bg-emerald-50 text-emerald-600',
    },
    {
      icon: Archive,
      value: metrics.storageUnits,
      label: 'Storage Units',
      accent: 'bg-sky-50 text-sky-600',
    },
    {
      icon: PackagePlus,
      value: metrics.spareItems,
      label: 'Spare Items',
      accent: 'bg-amber-50 text-amber-600',
    },
    {
      icon: AlertTriangle,
      value: metrics.defectiveItems,
      label: 'Need Attention',
      accent: 'bg-rose-50 text-rose-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 border border-border-main">
      {cards.map((card, i) => (
        <div key={i} className={i < cards.length - 1 ? 'border-r border-border-main' : ''}>
          <MetricCard {...card} />
        </div>
      ))}
    </div>
  );
}
