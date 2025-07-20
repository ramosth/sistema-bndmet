// Relatórios automatizados
// ============= src/app/relatorios/page.js =============
'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import ReportsContent from '@/components/reports/ReportsContent';

export default function ReportsPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout>
        <ReportsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}