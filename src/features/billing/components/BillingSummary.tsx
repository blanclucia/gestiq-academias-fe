import type { ReactNode } from 'react'
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
        <div style={{ display: 'grid', gap: 16, marginBottom: 16 }}>
            <div className="billing-summary-date-range">{dateRangeControl}</div>
            <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0 0' }} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
                <div className="kpi-card" style={{ minHeight: 0, padding: '14px 16px', background: 'rgba(34, 197, 94, 0.08)' }}>
                    <div className="kpi-title">Cobrado</div>
                    <div className="kpi-value" style={{ fontSize: '1.8rem' }}>${metrics.totalReceived.toLocaleString('es-AR')}</div>
                    <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 6 }}>{metrics.receivedCount} cobro{metrics.receivedCount === 1 ? '' : 's'} confirmado{metrics.receivedCount === 1 ? '' : 's'}</div>
                </div>
                <div className="kpi-card" style={{ minHeight: 0, padding: '14px 16px' }}>
                    <div className="kpi-title">Pendiente</div>
                    <div className="kpi-value" style={{ fontSize: '1.8rem' }}>${metrics.totalPending.toLocaleString('es-AR')}</div>
                    <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 6 }}>{metrics.pendingCount} cobro{metrics.pendingCount === 1 ? '' : 's'} por gestionar</div>
                </div>
                <div className="kpi-card" style={{ minHeight: 0, padding: '14px 16px', background: 'rgba(249, 115, 22, 0.08)' }}>
                    <div className="kpi-title">Vencido</div>
                    <div className="kpi-value" style={{ fontSize: '1.8rem' }}>${metrics.totalOverdue.toLocaleString('es-AR')}</div>
                    <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 6 }}>{metrics.overdueCount} cobro{metrics.overdueCount === 1 ? '' : 's'} en mora</div>
                </div>
                <div className="kpi-card" style={{ minHeight: 0, padding: '14px 16px' }}>
                    <div className="kpi-title">Eficiencia de cobranza</div>
                    <div className="kpi-value" style={{ fontSize: '1.8rem' }}>{collectionRate.toFixed(1)}%</div>
                    <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 6 }}>Riesgo vencido: {riskRate.toFixed(1)}% · Recordatorios: {metrics.remindersSent}</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                <div className="kpi-card" style={{ minHeight: 0, padding: '16px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div><div className="kpi-title">Panorama del rango</div><div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>{periodLabel}</div></div>
                        <strong style={{ fontSize: 18 }}>${totalPortfolio.toLocaleString('es-AR')}</strong>
                    </div>
                    <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
                        <ProgressMetric label="Cobrado" rate={collectionRate} color="var(--green)" />
                        <ProgressMetric label="Riesgo vencido" rate={riskRate} color="var(--red)" />
                    </div>
                </div>

                <div className="kpi-card" style={{ minHeight: 0, padding: '16px 18px' }}>
                    <div className="kpi-title">Cobrado por medio</div>
                    <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
                        {metrics.receivedByMethod.map((metric) => {
                            const methodRate = metrics.totalReceived > 0 ? (metric.total / metrics.totalReceived) * 100 : 0
                            return (
                                <div key={metric.method}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12 }}><strong style={{ fontSize: 13 }}>{metric.method}</strong><span style={{ color: 'var(--muted)' }}>{methodRate.toFixed(1)}%</span></div>
                                    <div className="progress-bar" style={{ marginTop: 6 }}><span style={{ width: `${methodRate}%` }} /></div>
                                    <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>${metric.total.toLocaleString('es-AR')} · {metric.count} pago{metric.count === 1 ? '' : 's'}</div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}

function ProgressMetric({ label, rate, color }: { label: string; rate: number; color: string }) {
    return <div><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)' }}><span>{label}</span><span>{rate.toFixed(1)}%</span></div><div className="progress-bar" style={{ marginTop: 6 }}><span style={{ width: `${rate}%`, background: color }} /></div></div>
}
