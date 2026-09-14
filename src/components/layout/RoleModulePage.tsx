import type { LucideIcon } from 'lucide-react'

export function RoleModulePage({ title, description, icon: Icon }: { title: string; description: string; icon: LucideIcon }) {
    return <div className="dashboard-page empty-module-page"><div className="page-header"><div><h1>{title}</h1><p>{description}</p></div></div><div className="chart-card empty-module-card"><div className="empty-module-content"><Icon size={30} /><h3>{title}</h3><p>Esta experiencia se completará en la siguiente iteración.</p></div></div></div>
}
