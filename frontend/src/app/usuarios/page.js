// Gestão de usuários
// ============= src/app/usuarios/page.js =============
'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import UsersContent from '@/components/users/UsersContent';

export default function UsersPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout>
        <UsersContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}