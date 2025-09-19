import * as React from "react"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background ${
          variant === 'secondary' ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' :
          variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' :
          variant === 'outline' ? 'border border-input bg-background hover:bg-accent hover:text-accent-foreground' :
          variant === 'ghost' ? 'hover:bg-accent hover:text-accent-foreground' :
          variant === 'link' ? 'underline-offset-4 hover:underline text-primary' :
          'bg-primary text-primary-foreground hover:bg-primary/90'
        } ${
          size === 'sm' ? 'h-9 rounded-md px-3' :
          size === 'lg' ? 'h-11 rounded-md px-8' :
          size === 'icon' ? 'h-10 w-10' :
          'h-10 py-2 px-4'
        } ${className || ''}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }