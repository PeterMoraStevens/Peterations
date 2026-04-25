import { AdminBreadcrumb } from '@/components/admin/Breadcrumb'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <AdminBreadcrumb />
        {children}
      </div>
    </div>
  )
}
