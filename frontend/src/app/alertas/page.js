// Central de alertas
// ============= src/app/alertas/page.js =============
'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import AlertsContent from '@/components/alerts/AlertsContent';

export default function AlertsPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout>
        <AlertsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}