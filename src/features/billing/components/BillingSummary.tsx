import type { ReactNode } from 'react'
import { ChartCard } from '@/components/layout/ChartCard'
import { KpiCard } from '@/components/layout/KpiCard'
import { formatCurrencyARS } from '@/domain/shared/formattingRules'
import type { Payment } from '@/types/domain'

export type BillingSummaryMetrics = {
    totalReceived: number
    receivedCount: number
    totalPending: number
    pendingCount: number
    totalOverdue: number
    overdueCount: number
    remindersSent: number
    receivedByMethod: Array<{ method: Payment['method']; total: number; count: number }>
}

type BillingSummaryProps = {
    dateRangeControl: ReactNode
    metrics: BillingSummaryMetrics
    periodLabel: string
    totalPortfolio: number
    collectionRate: number
    riskRate: number
}

export function BillingSummary({ dateRangeControl, metrics, periodLabel, totalPortfolio, collectionRate, riskRate }: BillingSummaryProps) {
    return (
        // Same structure as Finanzas → Resumen (date range, then kpi-grid in normal flow), so both summaries
        // space identically; a grid container here added the kpi-grid margin on top of its gap.
        <div style={{ marginBottom: 16 }}>
            <div className="summary-date-range">{dateRangeControl}</div>

            {/* Same KpiCard and grid as Finanzas and the dashboards, so KPIs read alike across modules. */}
            <div className="kpi-grid">
                <KpiCard title="Cobrado" value={formatCurrencyARS(metrics.totalReceived)} change={`${metrics.receivedCount} cobro${metrics.receivedCount === 1 ? '' : 's'} confirmado${metrics.receivedCount === 1 ? '' : 's'}`} />
                <KpiCard title="Pendiente" value={formatCurrencyARS(metrics.totalPending)} change={`${metrics.pendingCount} cobro${metrics.pendingCount === 1 ? '' : 's'} por gestionar`} positive={false} />
                <KpiCard title="Vencido" value={formatCurrencyARS(metrics.totalOverdue)} change={`${metrics.overdueCount} cobro${metrics.overdueCount === 1 ? '' : 's'} en mora`} positive={false} />
                <KpiCard title="Eficiencia de cobranza" value={`${collectionRate.toFixed(1)}%`} change={`Riesgo vencido: ${riskRate.toFixed(1)}%`} positive={collectionRate >= riskRate} />
            </div>

            <div className="summary-panels">
                <ChartCard title="Panorama del rango" subtitle={periodLabel} value={formatCurrencyARS(totalPortfolio)}>
                    <div style={{ display: 'grid', gap: 10 }}>
                        <ProgressMetric label="Cobrado" rate={collectionRate} color="var(--green)" />
                        <ProgressMetric label="Riesgo vencido" rate={riskRate} color="var(--red)" />
                    </div>
                </ChartCard>

                <ChartCard title="Cobrado por medio" subtitle="Solo los medios habilitados o que registraron cobros.">
                    <div style={{ display: 'grid', gap: 10 }}>
                        {metrics.receivedByMethod.map((metric) => {
                            const methodRate = metrics.totalReceived > 0 ? (metric.total / metrics.totalReceived) * 100 : 0
                            return (
                                <div key={metric.method}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12 }}><strong style={{ fontSize: 13 }}>{metric.method}</strong><span style={{ color: 'var(--muted)' }}>{methodRate.toFixed(1)}%</span></div>
                                    <div className="progress-bar" style={{ marginTop: 6 }}><span style={{ width: `${methodRate}%` }} /></div>
                                    <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>{formatCurrencyARS(metric.total)} · {metric.count} cobro{metric.count === 1 ? '' : 's'}</div>
                                </div>
                            )
                        })}
                    </div>
                </ChartCard>
            </div>
        </div>
    )
}

function ProgressMetric({ label, rate, color }: { label: string; rate: number; color: string }) {
    return <div><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)' }}><span>{label}</span><span>{rate.toFixed(1)}%</span></div><div className="progress-bar" style={{ marginTop: 6 }}><span style={{ width: `${rate}%`, background: color }} /></div></div>
}
