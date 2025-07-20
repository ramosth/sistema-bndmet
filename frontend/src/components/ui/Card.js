// Componente de card
// ============= src/components/ui/Card.js =============
export default function Card({ 
  children, 
  header, 
  title,
  className = '',
  ...props 
}) {
  return (
    <div className={`card ${className}`} {...props}>
      {(header || title) && (
        <div className="card-header">
          {title && <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>{title}</h3>}
          {header && !title && header}
        </div>
      )}
      <div className="card-body">
        {children}
      </div>
    </div>
  );
}