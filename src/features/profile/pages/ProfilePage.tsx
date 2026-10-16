import { Bell, IdCard, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const tabs = [
    { id: 'datos', label: 'Datos personales' },
    { id: 'notificaciones', label: 'Notificaciones' },
    { id: 'seguridad', label: 'Seguridad' },
] as const

const roleLabels: Record<string, string> = { admin: 'Administrador', teacher: 'Docente', student: 'Alumno' }
const administrativeLevelLabels: Record<string, string> = { owner: 'Owner', branch_admin: 'Administrador de sede' }

export function ProfilePage() {
    const { session } = useAuth()
    const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('datos')
    const roleLabel = session?.administrativeLevel ? administrativeLevelLabels[session.administrativeLevel] : session?.roles.map((role) => roleLabels[role] ?? role).join(', ')

    return (
        <div className="dashboard-page">
            <div className="page-header academy-settings-header">
                <div>
                    <h1>Mi perfil</h1>
                    <p>Información de tu cuenta y accesos en {session?.organization.name}.</p>
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
                        <Card>
                            <SectionHeading icon={<IdCard size={20} />} title="Datos personales" description="Tu identidad dentro de la organización." />
                            <div className="form-grid academy-settings-grid">
                                <div className="form-field">
                                    <span className="form-field-label">Nombre</span>
                                    <p className="detail-info-copy">{session?.user.name}</p>
                                </div>
                                <div className="form-field">
                                    <span className="form-field-label">Email</span>
                                    <p className="detail-info-copy">{session?.user.email}</p>
                                </div>
                                <div className="form-field">
                                    <span className="form-field-label">Academia</span>
                                    <p className="detail-info-copy">{session?.organization.name}</p>
                                </div>
                                <div className="form-field">
                                    <span className="form-field-label">Rol</span>
                                    <p className="detail-info-copy">{roleLabel}</p>
                                </div>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'seguridad' && (
                        <Card>
                            <SectionHeading icon={<ShieldCheck size={20} />} title="Seguridad" description="Acceso y permisos del usuario." />
                            <div className="academy-placeholder">
                                <p>Próximamente se definirán permisos, sesiones activas y configuraciones de seguridad.</p>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'notificaciones' && (
                        <Card>
                            <SectionHeading icon={<Bell size={20} />} title="Notificaciones" description="Alertas y avisos del sistema." />
                            <div className="academy-placeholder">
                                <p>Próximamente se configurarán los canales, frecuencia y alertas de notificación.</p>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
