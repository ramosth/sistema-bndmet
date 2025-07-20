// Configurações do sistema
// ============= src/app/configuracoes/page.js =============
'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import SettingsContent from '@/components/settings/SettingsContent';

export default function SettingsPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout>
        <SettingsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}