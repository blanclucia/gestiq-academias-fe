import { Plus } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export type BillingTab = 'resumen' | 'recibidos' | 'pendientes' | 'vencidos'

export function BillingContextHeader({ activeTab, onTabChange, onNewCharge }: { activeTab: BillingTab; onTabChange: (tab: BillingTab) => void; onNewCharge: () => void }) {
    return (
        <div className="payments-context-header">
            <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as BillingTab)}>
                <TabsList variant="line" aria-label="Vista de pagos">
                    <TabsTrigger value="resumen">Resumen</TabsTrigger>
                    <TabsTrigger value="recibidos">Recibidos</TabsTrigger>
                    <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
                    <TabsTrigger value="vencidos">Vencidos</TabsTrigger>
                </TabsList>
            </Tabs>
            <button type="button" className="primary-button compact-button context-primary-action" onClick={onNewCharge}><Plus size={16} /> Nuevo cobro</button>
        </div>
    )
}
