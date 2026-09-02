import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'glass' | 'icon';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]';
    
    const variants = {
      primary: 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/20',
      secondary: 'bg-surface-100 hover:bg-surface-200 border border-white/10 text-white',
      glass: 'glass-subtle glass-interactive text-white hover:text-white',
      icon: 'text-slate-400 hover:text-white hover:bg-white/10'
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs rounded-lg',
      md: 'px-5 py-2.5 text-sm rounded-xl',
      lg: 'px-6 py-3 text-base rounded-xl',
      icon: 'p-2 rounded-xl'
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant]} ${sizes[variant === 'icon' ? 'icon' : size]} ${className}`}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {!isLoading && leftIcon}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
