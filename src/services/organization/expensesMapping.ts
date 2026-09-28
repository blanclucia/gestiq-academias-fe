export function expenseCategoryToApi(category: 'Alquiler' | 'Servicios' | 'Sueldos' | 'Impuestos' | 'Insumos' | 'Otro'): 'rent' | 'utilities' | 'salaries' | 'taxes' | 'supplies' | 'other' {
    if (category === 'Alquiler') return 'rent'
    if (category === 'Servicios') return 'utilities'
    if (category === 'Sueldos') return 'salaries'
    if (category === 'Impuestos') return 'taxes'
    if (category === 'Insumos') return 'supplies'
    return 'other'
}
export function expenseCategoryFromApi(category: 'rent' | 'utilities' | 'salaries' | 'taxes' | 'supplies' | 'other'): 'Alquiler' | 'Servicios' | 'Sueldos' | 'Impuestos' | 'Insumos' | 'Otro' {
    if (category === 'rent') return 'Alquiler'
    if (category === 'utilities') return 'Servicios'
    if (category === 'salaries') return 'Sueldos'
    if (category === 'taxes') return 'Impuestos'
    if (category === 'supplies') return 'Insumos'
    return 'Otro'
}
export function expenseStatusToApi(status: 'Pendiente' | 'Pagado'): 'pending' | 'paid' {
    return status === 'Pagado' ? 'paid' : 'pending'
}
export function expenseStatusFromApi(status: 'pending' | 'paid'): 'Pendiente' | 'Pagado' {
    return status === 'paid' ? 'Pagado' : 'Pendiente'
}
export function expenseRecurrenceToApi(recurrence: 'Único' | 'Mensual'): 'single' | 'monthly' {
    return recurrence === 'Mensual' ? 'monthly' : 'single'
}
export function expenseRecurrenceFromApi(recurrence: 'single' | 'monthly'): 'Único' | 'Mensual' {
    return recurrence === 'monthly' ? 'Mensual' : 'Único'
}
