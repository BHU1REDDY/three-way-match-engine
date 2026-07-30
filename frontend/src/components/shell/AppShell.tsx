'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';

function IconButton({
  href,
  label,
  active,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      title={label}
      className={`relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
        active ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
      }`}
    >
      {active && <span className="absolute -left-2 h-5 w-0.5 rounded-full bg-indigo-600" />}
      {children}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex flex-1 min-h-0">
      <aside className="flex w-14 flex-col items-center gap-1 border-r border-gray-200 bg-white py-4">
        <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white shadow-sm shadow-indigo-600/30">
          3W
        </div>
        <IconButton href="/" label="Purchase Orders" active={pathname === '/'}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 11.5 12 4l9 7.5" />
            <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
          </svg>
        </IconButton>
        <IconButton href="/masters" label="SKU Master" active={pathname === '/masters'}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
          </svg>
        </IconButton>
        <div className="flex-1" />
        <button
          title="Log out"
          onClick={() => {
            logout();
            router.push('/login');
          }}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
        </button>
      </aside>
      <main className="flex-1 min-w-0 overflow-auto bg-gray-50">{children}</main>
    </div>
  );
}
