// Barra lateral de navegação — colapsável via hamburguer
// ============= src/components/layout/Sidebar.js =============
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Users, Activity, AlertTriangle,
  FileText, Settings, LogOut, Menu, ChevronLeft,
} from 'lucide-react';

const menuItems = [
  { path: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { path: '/usuarios',     label: 'Usuários',     icon: Users           },
  { path: '/sensores',     label: 'Sensores',     icon: Activity        },
  { path: '/alertas',      label: 'Alertas',      icon: AlertTriangle   },
  { path: '/relatorios',   label: 'Relatórios',   icon: FileText        },
  { path: '/configuracoes',label: 'Configurações',icon: Settings        },
];

export default function Sidebar({ collapsed = false, onToggle }) {
  const pathname  = usePathname();
  const { user, logout } = useAuth();

  const W = collapsed ? 64 : 240;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, bottom: 0,
      width: `${W}px`,
      backgroundColor: 'white',
      borderRight: '1px solid var(--gray-200)',
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.25s ease',
      overflow: 'hidden',
      zIndex: 100,
    }}>

      {/* Header da sidebar: logo + botão hamburguer */}
      <div style={{
        padding: '0 0.75rem',
        height: '64px',
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        borderBottom: '1px solid var(--gray-200)',
        flexShrink: 0,
      }}>
        {/* Logo — oculto quando collapsed */}
        {!collapsed && (
          <div>
            <h1 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--primary-blue)', margin: 0, whiteSpace: 'nowrap' }}>
              TCC IPRJ
            </h1>
            <p style={{ fontSize: '0.7rem', color: 'var(--gray-500)', margin: '0.1rem 0 0', whiteSpace: 'nowrap' }}>
              Monitoramento
            </p>
          </div>
        )}

        {/* Botão hamburguer */}
        <button
          onClick={onToggle}
          title={collapsed ? 'Expandir menu' : 'Retrair menu'}
          style={{
            width: '32px', height: '32px', borderRadius: '0.375rem',
            border: '1px solid var(--gray-200)',
            backgroundColor: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
            color: 'var(--gray-500)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--gray-50)'; e.currentTarget.style.color = 'var(--primary-blue)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = 'var(--gray-500)'; }}
        >
          {collapsed ? <Menu size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navegação */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0.5rem 0', scrollbarWidth: 'thin' }}>
        {menuItems.map(({ path, label, icon: Icon }) => {
          const isActive = pathname === path;
          return (
            <Link
              key={path}
              href={path}
              title={collapsed ? label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: collapsed ? 0 : '0.75rem',
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? '0.75rem' : '0.75rem 1.25rem',
                color: isActive ? 'var(--primary-blue)' : 'var(--gray-600)',
                backgroundColor: isActive ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                textDecoration: 'none',
                borderRight: isActive ? '3px solid var(--primary-blue)' : '3px solid transparent',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--gray-50)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              {!collapsed && (
                <span style={{ fontSize: '0.875rem', fontWeight: isActive ? '600' : '400' }}>
                  {label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Rodapé: usuário + logout */}
      <div style={{
        borderTop: '1px solid var(--gray-200)', flexShrink: 0,
        padding: collapsed ? '0.75rem 0' : '0.875rem',
        backgroundColor: 'white',
      }}>
        {/* Info do usuário — só expandido */}
        {!collapsed && (
          <div style={{
            padding: '0.625rem 0.75rem',
            backgroundColor: 'var(--gray-50)',
            borderRadius: '0.5rem',
            marginBottom: '0.625rem',
            overflow: 'hidden',
          }}>
            <p style={{ fontSize: '0.825rem', fontWeight: '600', color: 'var(--gray-800)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.nome}
            </p>
            <p style={{ fontSize: '0.7rem', color: 'var(--gray-500)', margin: '0.1rem 0 0' }}>
              {user?.perfil === 'super_admin' ? 'Super Admin' : 'Administrador'}
            </p>
          </div>
        )}

        {/* Botão logout */}
        <button
          onClick={logout}
          title={collapsed ? 'Sair' : undefined}
          style={{
            width: '100%', display: 'flex', alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: collapsed ? 0 : '0.5rem',
            padding: collapsed ? '0.625rem' : '0.625rem 0.75rem',
            backgroundColor: 'transparent',
            border: '1px solid var(--gray-200)',
            borderRadius: '0.375rem',
            color: 'var(--gray-500)',
            fontSize: '0.825rem', fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--red-50)'; e.currentTarget.style.borderColor = 'var(--red-200)'; e.currentTarget.style.color = 'var(--red-600)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'var(--gray-200)'; e.currentTarget.style.color = 'var(--gray-500)'; }}
        >
          <LogOut size={15} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </div>
  );
}