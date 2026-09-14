import type { Payment } from '@/types/domain'

export type InitialPayment = Payment & {
    originalAmount: number
    lastReminderAt?: string
}

export const initialPayments: InitialPayment[] = [
    { id: 'PAY-201', student: 'Lucía Gómez', concept: 'Mensualidad Agosto', method: 'Transferencia', date: '2026-08-02', dueDate: '2026-08-05', amount: 48000, originalAmount: 48000, status: 'Pagado', lastReminderAt: '2026-08-01' },
    { id: 'PAY-202', student: 'Mateo Ruiz', concept: 'Mensualidad Agosto', method: 'Tarjeta', date: '-', dueDate: '2026-08-29', amount: 52000, originalAmount: 52000, status: 'Pendiente' },
    { id: 'PAY-203', student: 'Sofía Alvarez', concept: 'Mensualidad Agosto', method: 'Efectivo', date: '2026-08-08', dueDate: '2026-08-07', amount: 52000, originalAmount: 52000, status: 'Pagado', lastReminderAt: '2026-08-05' },
    { id: 'PAY-204', student: 'Nicolás Peña', concept: 'Mensualidad Julio', method: 'Transferencia', date: '-', dueDate: '2026-08-20', amount: 48000, originalAmount: 48000, status: 'Pendiente', lastReminderAt: '2026-08-21' },
    { id: 'PAY-205', student: 'Camila Ortega', concept: 'Matrícula Septiembre', method: 'Tarjeta', date: '-', dueDate: '2026-09-03', amount: 48000, originalAmount: 48000, status: 'Pendiente' },
    { id: 'PAY-206', student: 'Federico Luna', concept: 'Mensualidad Agosto', method: 'Transferencia', date: '-', dueDate: '2026-08-26', amount: 52000, originalAmount: 52000, status: 'Rechazado' },
]
