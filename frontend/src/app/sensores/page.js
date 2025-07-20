// Monitoramento de sensores
// ============= src/app/sensores/page.js =============
'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import SensorsContent from '@/components/sensors/SensorsContent';

export default function SensorsPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout>
        <SensorsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}