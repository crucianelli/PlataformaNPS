import { ReactNode } from 'react'
import PageHeader from '@/components/layout/PageHeader'

interface PageContainerProps {
  children: ReactNode
  title?: string
  description?: string
  actions?: ReactNode
}

export default function PageContainer({ children, title, description, actions }: PageContainerProps) {
  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 py-4 md:px-6 md:py-6">
      {(title || actions) && (
        <div className="mb-6">
          <PageHeader title={title!} description={description} actions={actions} />
        </div>
      )}
      {children}
    </div>
  )
}
