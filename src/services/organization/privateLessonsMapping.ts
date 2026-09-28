export function privateLessonPlanToApi(plan: string): 'single' | 'monthly' | 'pack4' | 'pack8' | 'pack12' {
    if (plan === 'Plan mensual') return 'monthly'
    if (plan === 'Pack 4 clases') return 'pack4'
    if (plan === 'Pack 8 clases') return 'pack8'
    if (plan === 'Pack 12 clases') return 'pack12'
    return 'single'
}
export function privateLessonPlanFromApi(plan: 'single' | 'monthly' | 'pack4' | 'pack8' | 'pack12'): 'Clase individual' | 'Plan mensual' | 'Pack 4 clases' | 'Pack 8 clases' | 'Pack 12 clases' {
    if (plan === 'monthly') return 'Plan mensual'
    if (plan === 'pack4') return 'Pack 4 clases'
    if (plan === 'pack8') return 'Pack 8 clases'
    if (plan === 'pack12') return 'Pack 12 clases'
    return 'Clase individual'
}
export function privateLessonStatusToApi(status: 'Activa' | 'Pausada' | 'Finalizada'): 'active' | 'finished' {
    return status === 'Finalizada' ? 'finished' : 'active'
}
export function privateLessonStatusFromApi(status: 'active' | 'finished'): 'Activa' | 'Finalizada' {
    return status === 'finished' ? 'Finalizada' : 'Activa'
}
