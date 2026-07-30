'use client';

export interface SubTabPillDef {
  id: string;
  label: string;
}

export function SubTabPills({
  items,
  activeId,
  onChange,
}: {
  items: SubTabPillDef[];
  activeId: string | null;
  onChange: (id: string) => void;
}) {
  if (items.length === 0) {
    return <p className="border-b border-gray-100 bg-gray-50/70 px-5 py-3 text-sm text-gray-400">No documents uploaded yet.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2 border-b border-gray-100 bg-gray-50/70 px-5 py-2.5">
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              isActive
                ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
