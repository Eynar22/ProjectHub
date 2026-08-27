import { InputHTMLAttributes, TextareaHTMLAttributes, useId, useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

/* Campo con borde visible (contraste ≥3:1), etiqueta asociada, altura 44px,
 * font-size 16px (evita zoom en iOS) y error con icono + texto (Manual 8.3). */
const fieldClass =
  'w-full min-h-11 px-4 py-2.5 text-base bg-input-background text-foreground ' +
  'border border-input rounded-md transition-colors ' +
  'placeholder:text-muted-foreground ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ' +
  'aria-[invalid=true]:border-danger';

export function Input({ label, error, hint, className = '', type, id, ...props }: InputProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;
  const describedBy = [hint && `${fieldId}-hint`, error && `${fieldId}-error`].filter(Boolean).join(' ') || undefined;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={fieldId} className="block mb-2 text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={fieldId}
          type={inputType}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${fieldClass} ${isPassword ? 'pr-11' : ''} ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {hint && !error && (
        <p id={`${fieldId}-hint`} className="mt-1 text-sm text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p id={`${fieldId}-error`} role="alert" className="mt-1 flex items-center gap-1.5 text-sm text-danger-strong">
          <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

export function TextArea({ label, error, hint, className = '', id, ...props }: TextAreaProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const describedBy = [hint && `${fieldId}-hint`, error && `${fieldId}-error`].filter(Boolean).join(' ') || undefined;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={fieldId} className="block mb-2 text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <textarea
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`${fieldClass} min-h-24 resize-none ${className}`}
        {...props}
      />
      {hint && !error && (
        <p id={`${fieldId}-hint`} className="mt-1 text-sm text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p id={`${fieldId}-error`} role="alert" className="mt-1 flex items-center gap-1.5 text-sm text-danger-strong">
          <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
