import { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface SectionContainerProps {
  children: ReactNode
  className?: string
}

export default function SectionContainer({ children, className }: SectionContainerProps) {
  return (
    <div className={cn('mx-auto w-full max-w-screen-2xl px-4 py-4 md:px-6 md:py-6', className)}>
      {children}
    </div>
  )
}
