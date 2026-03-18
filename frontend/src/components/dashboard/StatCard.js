// StatCard — KPI compacto para o dashboard
// ============= src/components/dashboard/StatCard.js =============

export default function StatCard({ icon: Icon, iconColor, value, label, sub, valueColor }) {
  return (
    <div style={{
      padding: '1rem 1.25rem', backgroundColor: 'white',
      borderRadius: '0.5rem', border: '1px solid #e5e7eb',
      display: 'flex', alignItems: 'center', gap: '0.875rem',
    }}>
      <div style={{
        width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem',
        backgroundColor: `${iconColor}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={20} color={iconColor} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '1.375rem', fontWeight: '700', color: valueColor || '#111827', lineHeight: 1.2 }}>
          {value}
        </div>
        <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#374151', marginTop: '0.1rem' }}>
          {label}
        </div>
        {sub && <div style={{ fontSize: '0.68rem', color: '#9ca3af', marginTop: '0.1rem' }}>{sub}</div>}
      </div>
    </div>
  );
}