'use client';

import type { TopTab } from '@/lib/uiContext';

interface TabDef {
  id: TopTab;
  label: string;
  count?: number;
}

export function TopTabs({
  active,
  onChange,
  poCount,
  fulfillmentCount,
  deliveryCount,
}: {
  active: TopTab;
  onChange: (tab: TopTab) => void;
  poCount: number;
  fulfillmentCount: number;
  deliveryCount: number;
}) {
  const tabs: TabDef[] = [
    { id: 'po', label: 'Purchase Order', count: poCount },
    { id: 'fulfillment', label: 'Fulfillment', count: fulfillmentCount },
    { id: 'delivery', label: 'Delivery', count: deliveryCount },
    { id: 'summary', label: 'Summary' },
  ];

  return (
    <div className="flex gap-1 border-b border-gray-200 bg-white px-5">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative -mb-px flex items-center gap-2 border-b-2 px-3.5 py-3 text-sm transition-colors ${
              isActive
                ? 'border-indigo-600 font-semibold text-indigo-600'
                : 'border-transparent font-medium text-gray-500 hover:border-gray-200 hover:text-gray-800'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-semibold tabular-nums ${
                  isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
