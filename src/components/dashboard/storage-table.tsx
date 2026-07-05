'use client';

import { storageUnits } from '@/data/mock-data';
import { ChevronRight } from 'lucide-react';

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { dot: string; text: string; bg: string; label: string }> = {
    full: { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', label: 'Full' },
    'has-spares': { dot: 'bg-header-accent', text: 'text-sky-700', bg: 'bg-sky-50', label: 'Has Spares' },
    empty: { dot: 'bg-secondary', text: 'text-secondary', bg: 'bg-canvas', label: 'Empty' },
  };

  const c = config[status] || config.empty;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none text-xs font-medium ${c.bg} ${c.text} border border-border-main`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

export default function StorageTable() {
  return (
    <div className="bg-card border border-border-main overflow-hidden">
      <div className="px-6 py-5 border-b border-border-main">
        <h3 className="text-base font-semibold text-primary">All Storage Units</h3>
        <p className="text-sm text-secondary mt-0.5">{storageUnits.length} containers across all spaces</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-main bg-canvas">
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-secondary uppercase tracking-wider">Storage Name</th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-secondary uppercase tracking-wider">Location</th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-secondary uppercase tracking-wider">Items</th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-secondary uppercase tracking-wider">Status</th>
              <th className="text-right px-6 py-3.5 text-xs font-semibold text-secondary uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody>
            {storageUnits.map((unit, index) => (
              <tr
                key={unit.id}
                className={`border-b border-border-main/20 hover:bg-header-accent/5 transition-colors duration-150 cursor-pointer group ${
                  index === storageUnits.length - 1 ? 'border-b-0' : ''
                }`}
              >
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-primary">{unit.name}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-secondary">{unit.spaceName}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-primary">{unit.totalItems}</span>
                    <span className="text-xs text-secondary">/ {unit.capacity}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={unit.status} />
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="inline-flex items-center gap-1 text-xs font-medium text-secondary group-hover:text-primary transition-colors duration-150">
                    View
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
