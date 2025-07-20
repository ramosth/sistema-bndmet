// Cards de estatísticas
// ============= src/components/dashboard/StatCard.js =============
import { TrendingUp } from 'lucide-react';

export default function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  trend, 
  status = 'normal' 
}) {
  const getStatusColor = () => {
    switch (status) {
      case 'critical': return 'var(--red-500)';
      case 'warning': return 'var(--yellow-500)';
      case 'normal': return 'var(--green-500)';
      default: return color;
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        <div className="flex-between mb-4">
          <div>
            <p style={{
              fontSize: '0.875rem',
              color: 'var(--gray-600)',
              margin: '0 0 0.5rem 0'
            }}>
              {title}
            </p>
            <p style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: 'var(--gray-800)',
              margin: 0
            }}>
              {value}
            </p>
          </div>
          
          <div style={{
            width: '3rem',
            height: '3rem',
            backgroundColor: `${getStatusColor()}20`,
            borderRadius: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Icon size={24} color={getStatusColor()} />
          </div>
        </div>

        {trend && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            <TrendingUp size={14} color="var(--green-500)" />
            <span style={{
              fontSize: '0.75rem',
              color: 'var(--green-500)',
              fontWeight: '500'
            }}>
              {trend}
            </span>
            <span style={{
              fontSize: '0.75rem',
              color: 'var(--gray-500)'
            }}>
              vs. mês anterior
            </span>
          </div>
        )}

        {status !== 'normal' && (
          <div style={{
            marginTop: '0.5rem',
            padding: '0.25rem 0.5rem',
            backgroundColor: `${getStatusColor()}20`,
            borderRadius: '0.25rem',
            fontSize: '0.75rem',
            color: getStatusColor(),
            fontWeight: '500'
          }}>
            {status === 'critical' ? 'Atenção Necessária' : 'Monitorar'}
          </div>
        )}
      </div>
    </div>
  );
}