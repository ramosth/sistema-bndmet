// Componente de loading
// ============= src/components/ui/LoadingSpinner.js =============
export default function LoadingSpinner({ size = 'medium', color = 'var(--primary-blue)' }) {
  const sizes = {
    small: '1rem',
    medium: '1.5rem',
    large: '2rem'
  };

  return (
    <div 
      className="loading"
      style={{
        width: sizes[size],
        height: sizes[size],
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderTopColor: color
      }}
    />
  );
}