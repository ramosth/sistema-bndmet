// Componente de proteção de rotas
// ============= src/components/ProtectedRoute.js =============
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function ProtectedRoute({ 
  children, 
  requiredRole = null,
  fallbackPath = '/login' 
}) {
  const { isAuthenticated, loading, user, isAdmin, isSuperAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push(fallbackPath);
        return;
      }

      if (requiredRole) {
        const hasPermission = (() => {
          switch (requiredRole) {
            case 'admin':
              return isAdmin();
            case 'super_admin':
              return isSuperAdmin();
            default:
              return true;
          }
        })();

        if (!hasPermission) {
          router.push('/dashboard');
          return;
        }
      }
    }
  }, [isAuthenticated, loading, user, requiredRole, router, fallbackPath, isAdmin, isSuperAdmin]);

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '100vh' }}>
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRole) {
    const hasPermission = (() => {
      switch (requiredRole) {
        case 'admin':
          return isAdmin();
        case 'super_admin':
          return isSuperAdmin();
        default:
          return true;
      }
    })();

    if (!hasPermission) {
      return null;
    }
  }

  return children;
}