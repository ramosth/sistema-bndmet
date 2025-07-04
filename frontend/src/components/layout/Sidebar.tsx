'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Home, 
  BarChart3, 
  AlertTriangle, 
  Settings, 
  Activity,
  Database
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Gráficos', href: '/dashboard/graficos', icon: BarChart3 },
  { name: 'Alertas', href: '/dashboard/alertas', icon: AlertTriangle },
  { name: 'Logs', href: '/dashboard/logs', icon: Activity },
  { name: 'Dados', href: '/dashboard/dados', icon: Database },
  { name: 'Configurações', href: '/dashboard/configuracoes', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-gray-50 border-r">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b bg-white">
        <h1 className="text-xl font-bold text-gray-900">
          Sistema BNDMET
        </h1>
      </div>

      {/* Navegação */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Status da conexão */}
      <div className="border-t p-4">
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 rounded-full bg-green-400"></div>
          <span className="text-xs text-gray-600">Sistema Online</span>
        </div>
      </div>
    </div>
  );
}