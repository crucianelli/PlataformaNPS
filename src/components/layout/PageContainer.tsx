import { ReactNode } from 'react'

interface PageContainerProps {
  children: ReactNode
  title?: string
  actions?: ReactNode
}

export default function PageContainer({ children, title, actions }: PageContainerProps) {
  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8">
      {(title || actions) && (
        <div className="mb-7 flex items-center justify-between">
          {title && (
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
              <div className="mt-1.5 h-0.5 w-8 rounded-full bg-brand" />
            </div>
          )}
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  )
}
