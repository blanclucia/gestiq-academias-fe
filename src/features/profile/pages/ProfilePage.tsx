import { Bell, ShieldCheck, UserCircle2 } from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChartCard } from '@/components/layout/ChartCard'

const tabs = [
    { id: 'datos', label: 'Datos personales' },
    { id: 'notificaciones', label: 'Notificaciones' },
    { id: 'seguridad', label: 'Seguridad' },
] as const

export function ProfilePage() {
    const { session } = useAuth()
    const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('datos')

    return (
        <div className="dashboard-page">
            <div className="page-header">
                <div>
                    <h1>Mi perfil</h1>
                </div>
            </div>

            <div className="academy-tabs-wrap">
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as (typeof tabs)[number]['id'])}>
                    <TabsList variant="line" aria-label="Configuración de perfil">
                        {tabs.map((tab) => (
                            <TabsTrigger key={tab.id} value={tab.id}>
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>

                <div className="academy-tab-panel">
                    {activeTab === 'datos' && (
                        <ChartCard title="Datos personales" subtitle="Tu cuenta">
                            <div className="academy-placeholder">
                                <div className="academy-placeholder-icon">
                                    <UserCircle2 size={22} />
                                </div>
                                <dl><dt>Nombre</dt><dd>{session?.user.name}</dd><dt>Email</dt><dd>{session?.user.email}</dd><dt>Academia</dt><dd>{session?.organization.name}</dd></dl>
                            </div>
                        </ChartCard>
                    )}

                    {activeTab === 'seguridad' && (
                        <ChartCard title="Seguridad" subtitle="Acceso y permisos del usuario">
                            <div className="academy-placeholder">
                                <div className="academy-placeholder-icon">
                                    <ShieldCheck size={22} />
                                </div>
                                <p>Próximamente se definirán permisos, sesiones activas y configuraciones de seguridad.</p>
                            </div>
                        </ChartCard>
                    )}

                    {activeTab === 'notificaciones' && (
                        <ChartCard title="Notificaciones" subtitle="Alertas y avisos del sistema">
                            <div className="academy-placeholder">
                                <div className="academy-placeholder-icon">
                                    <Bell size={22} />
                                </div>
                                <p>Próximamente se configurarán los canales, frecuencia y alertas de notificación.</p>
                            </div>
                        </ChartCard>
                    )}
                </div>
            </div>
        </div>
    )
}
