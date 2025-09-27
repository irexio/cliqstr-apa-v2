// 🔘 APA-HARDENED BUTTON COMPONENT — supports solid/outline variants
// Matches Cliqstr nav styling (black + white default), used in modals, forms, and plan selection
// Verified: 2025-06-21

import * as React from 'react'
import clsx from 'clsx'

type ButtonVariant = 'solid' | 'outline'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'solid', ...props }, ref) => {
    const baseStyles = 'px-4 py-2 rounded-md font-semibold text-lg transition'

    const variantStyles = {
      solid: 'bg-[#202020] text-white hover:bg-[#c032d1]',
      outline: 'border border-[#202020] text-[#202020] bg-white hover:border-[#c032d1] hover:text-[#c032d1]',
    }

    return (
      <button
        ref={ref}
        className={clsx(baseStyles, variantStyles[variant], className)}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'
