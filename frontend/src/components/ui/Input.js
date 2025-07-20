// Componente de input
// ============= src/components/ui/Input.js =============
import { forwardRef } from 'react';

const Input = forwardRef(({ 
  label, 
  error, 
  type = 'text', 
  className = '',
  required = false,
  ...props 
}, ref) => {
  return (
    <div className="form-group">
      {label && (
        <label className="form-label">
          {label}
          {required && <span style={{ color: 'var(--red-500)' }}> *</span>}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        className={`form-input ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && (
        <div className="form-error">{error}</div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;