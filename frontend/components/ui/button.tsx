import * as React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'default': 'bg-black text-white hover:bg-gray-900',
            'outline': 'border border-gray-300 bg-white hover:bg-gray-50',
            'ghost': 'hover:bg-gray-100'
          }[variant],
          {
            'default': 'h-10 px-4 py-2',
            'sm': 'h-8 px-3 text-sm',
            'lg': 'h-12 px-8 text-lg',
            'icon': 'h-10 w-10'
          }[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button };
export type { ButtonProps };
