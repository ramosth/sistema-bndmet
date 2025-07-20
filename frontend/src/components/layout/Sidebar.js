// Barra lateral de navegação
// ============= src/components/layout/Sidebar.js =============
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Activity, 
  AlertTriangle, 
  FileText, 
  Settings,
  Menu,
  X,
  LogOut
} from 'lucide-react';

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'super_admin'] },
  { path: '/usuarios', label: 'Usuários', icon: Users, roles: ['admin', 'super_admin'] },
  { path: '/sensores', label: 'Sensores', icon: Activity, roles: ['admin', 'super_admin'] },
  { path: '/alertas', label: 'Alertas', icon: AlertTriangle, roles: ['admin', 'super_admin'] },
  { path: '/relatorios', label: 'Relatórios', icon: FileText, roles: ['admin', 'super_admin'] },
  { path: '/configuracoes', label: 'Configurações', icon: Settings, roles: ['admin', 'super_admin'] }
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuth();

  const filteredMenuItems = menuItems.filter(item => 
    !item.roles || item.roles.includes(user?.perfil)
  );

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--gray-200)' }}>
          <h1 style={{ 
            fontSize: '1.25rem', 
            fontWeight: '700', 
            color: 'var(--primary-blue)',
            margin: 0 
          }}>
            BNDMET
          </h1>
          <p style={{ 
            fontSize: '0.75rem', 
            color: 'var(--gray-500)', 
            margin: '0.25rem 0 0 0' 
          }}>
            Monitoramento
          </p>
        </div>

        <nav style={{ padding: '1rem 0', flex: 1 }}>
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            
            return (
              <Link
                key={item.path}
                href={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 1.5rem',
                  color: isActive ? 'var(--primary-blue)' : 'var(--gray-600)',
                  backgroundColor: isActive ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  borderRight: isActive ? '3px solid var(--primary-blue)' : '3px solid transparent'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.target.style.backgroundColor = 'var(--gray-50)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
                onClick={() => setIsOpen(false)}
              >
                <Icon size={18} style={{ marginRight: '0.75rem' }} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ 
          padding: '1rem', 
          borderTop: '1px solid var(--gray-200)',
          marginTop: 'auto'
        }}>
          <div style={{ 
            padding: '0.75rem', 
            backgroundColor: 'var(--gray-50)', 
            borderRadius: '0.375rem',
            marginBottom: '1rem'
          }}>
            <p style={{ 
              fontSize: '0.875rem', 
              fontWeight: '500', 
              margin: 0,
              color: 'var(--gray-800)'
            }}>
              {user?.nome}
            </p>
            <p style={{ 
              fontSize: '0.75rem', 
              color: 'var(--gray-500)', 
              margin: '0.25rem 0 0 0'
            }}>
              {user?.perfil === 'super_admin' ? 'Super Admin' : 'Administrador'}
            </p>
          </div>
          
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              padding: '0.75rem',
              backgroundColor: 'transparent',
              border: '1px solid var(--gray-300)',
              borderRadius: '0.375rem',
              color: 'var(--gray-600)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '0.875rem'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--red-50)';
              e.target.style.borderColor = 'var(--red-300)';
              e.target.style.color = 'var(--red-600)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.borderColor = 'var(--gray-300)';
              e.target.style.color = 'var(--gray-600)';
            }}
          >
            <LogOut size={16} style={{ marginRight: '0.5rem' }} />
            Sair
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}