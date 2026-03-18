// Layout do painel administrativo — com sidebar colapsável
// ============= src/components/layout/DashboardLayout.js =============
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardLayout({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push('/login');
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '100vh' }}>
        <div className="loading" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(v => !v)}
      />
      <div style={{
        flex: 1,
        marginLeft: sidebarCollapsed ? '64px' : '240px',
        transition: 'margin-left 0.25s ease',
        minWidth: 0,
      }}>
        <Header />
        <main style={{
          padding: '2rem',
          backgroundColor: 'var(--gray-50)',
          minHeight: 'calc(100vh - 4rem)',
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}