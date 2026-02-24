import type { ReactNode } from 'react'

type GlowColor = 'primary' | 'success' | 'warning' | 'destructive' | 'info' | 'secondary' | 'muted'
type GlowSize = 'sm' | 'md' | 'lg'

interface GlowIconProps {
  icon: ReactNode
  color?: GlowColor
  size?: GlowSize
  className?: string
}

const bgClasses: Record<GlowColor, string> = {
  primary: 'bg-primary/5 backdrop-blur-sm text-primary',
  success: 'bg-success/5 backdrop-blur-sm text-success',
  warning: 'bg-warning/5 backdrop-blur-sm text-warning',
  destructive: 'bg-destructive/5 backdrop-blur-sm text-destructive',
  info: 'bg-info/5 backdrop-blur-sm text-info',
  secondary: 'bg-secondary/50 backdrop-blur-sm text-muted-foreground',
  muted: 'bg-muted/50 backdrop-blur-sm text-muted-foreground',
}

const glowClasses: Record<GlowColor, string> = {
  primary: '[&>span]:[filter:drop-shadow(0_0_6px_rgba(59,130,246,0.7))]',
  success: '[&>span]:[filter:drop-shadow(0_0_6px_rgba(34,197,94,0.7))]',
  warning: '[&>span]:[filter:drop-shadow(0_0_6px_rgba(251,191,36,0.7))]',
  destructive: '[&>span]:[filter:drop-shadow(0_0_6px_rgba(239,68,68,0.7))]',
  info: '[&>span]:[filter:drop-shadow(0_0_6px_rgba(168,85,247,0.7))]',
  secondary: '',
  muted: '',
}

const sizeClasses: Record<GlowSize, string> = {
  sm: 'p-2 rounded-lg',
  md: 'w-12 h-12 rounded-lg flex items-center justify-center',
  lg: 'w-14 h-14 rounded-lg flex items-center justify-center',
}

export function GlowIcon({ icon, color = 'primary', size = 'sm', className = '' }: GlowIconProps) {
  return (
    <div className={`${sizeClasses[size]} ${bgClasses[color]} ${glowClasses[color]} ${className}`}>
      <span className="block">{icon}</span>
    </div>
  )
}
