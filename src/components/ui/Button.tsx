import {forwardRef, type ButtonHTMLAttributes} from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; size?: 'sm' | 'md' | 'lg'; loading?: boolean};
export const Button = forwardRef<HTMLButtonElement, Props>(function Button({variant = 'secondary', size = 'md', loading, className = '', children, disabled, ...props}, ref) {
  return <button ref={ref} type="button" className={`button button-${variant} button-${size} ${className}`} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>{loading && <span className="button-spinner" aria-hidden="true"/>}{children}</button>;
});
