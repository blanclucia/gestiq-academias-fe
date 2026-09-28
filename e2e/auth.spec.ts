import { test, expect, type Page } from '@playwright/test'

const pair = { mustChangePassword: false, accessToken: `a_${'a'.repeat(43)}`, refreshToken: `r_${'b'.repeat(43)}`, tokenType: 'Bearer', expiresIn: 900, refreshExpiresIn: 6000 }
const organization = { id: 'organization-demo', slug: 'academy-demo', name: 'Academy Demo', productType: 'academy' }
const owner = {
    user: { id: 'owner-demo', name: 'Owner Demo', email: 'owner@example.com' }, organization,
    roles: ['admin'], administrativeLevel: 'owner', availableModes: ['ADMINISTRATION'], activeMode: 'ADMINISTRATION',
    administrativeAccess: { level: 'OWNER', scope: 'ACADEMY', branchIds: [] },
    accessibleBranches: [{ id: 'server-branch', name: 'Sede desde API' }],
    permissions: ['academy.read', 'academy.update', 'branches.read', 'branches.update', 'students.read', 'offers.manage', 'payments.read', 'reports.read', 'attendance.manage'],
}
async function mockAPI(page: Page, options: { initial?: boolean; denied?: boolean; student?: boolean; branchAdmin?: boolean } = {}) {
    const calls: { path: string; body: unknown }[] = []
    let initial = options.initial || false
    await page.route('**/api/v1/**', async (route) => {
        const path = new URL(route.request().url()).pathname.replace('/api/v1', '')
        const body = route.request().postDataJSON()
        calls.push({ path, body })
        const json = (value: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(value) })
        if (path.startsWith('/public/organizations/')) return json({ organization })
        if (path === '/auth/login') {
            if (options.denied) return json({ error: { code: 'unauthenticated' } }, 401)
            return json(initial ? { mustChangePassword: true, changePasswordToken: `p_${'p'.repeat(43)}`, expiresIn: 600 } : pair)
        }
        if (path === '/auth/change-password') {
            expect(route.request().headers().authorization).toMatch(/^Bearer p_/)
            initial = false
            return route.fulfill({ status: 204 })
        }
        if (path === '/session/context' && options.branchAdmin) return json({ ...owner, administrativeLevel: 'branch_admin', administrativeAccess: { level: 'BRANCH_ADMIN', scope: 'BRANCHES', branchIds: ['server-branch'] }, permissions: ['academy.read', 'branches.read'] })
        if (path === '/session/context') return json(options.student ? { ...owner, roles: ['student'], administrativeLevel: null, availableModes: ['STUDENT'], activeMode: 'STUDENT', administrativeAccess: null, accessibleBranches: [], permissions: ['academy.read'] } : owner)
        if (path === '/auth/logout') return route.fulfill({ status: 204 })
        return json({ error: { code: 'unexpected_test_request' } }, 500)
    })
    return calls
}
async function enter(page: Page, password = 'a-test-password') {
    await page.getByLabel('DNI', { exact: true }).fill('90.000.001')
    await page.getByLabel('Contraseña', { exact: true }).fill(password)
    await page.getByRole('button', { name: 'Ingresar', exact: true }).click()
}

test('login uses real identity, modes and branches; logout blocks back navigation', async ({ page }) => {
    const calls = await mockAPI(page)
    await page.goto('/login')
    await enter(page)
    await expect(page).toHaveURL(/\/academy-demo\/admin$/)
    await expect(page.getByRole('button', { name: 'Seleccionar sede' })).toContainText('Sede desde API')
    await page.getByRole('button', { name: 'Administración', exact: true }).click()
    await expect(page.getByRole('menuitem', { name: /Profesor/ })).toHaveCount(0)
    expect(calls.find((call) => call.path === '/auth/login')?.body).toMatchObject({ dni: '90000001', organizationSlug: 'academy-demo' })
    const storage = await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))
    expect(storage).not.toContain(pair.accessToken)
    expect(storage).not.toContain(pair.refreshToken)
    expect(storage).not.toContain('a-test-password')
    await page.getByRole('button', { name: 'User menu' }).click()
    await page.getByRole('menuitem', { name: 'Mi perfil' }).click()
    await page.getByRole('button', { name: 'User menu' }).click()
    await page.getByRole('menuitem', { name: 'Cerrar sesión' }).click()
    await expect(page.getByRole('heading', { name: 'Ingresá a tu academia' })).toBeVisible()
    expect(calls.some((call) => call.path === '/auth/logout')).toBeTruthy()
    await page.goBack()
    await expect(page.getByRole('heading', { name: 'Ingresá a tu academia' })).toBeVisible()
})

test('first access never requests a normal session before the mandatory change', async ({ page }) => {
    const calls = await mockAPI(page, { initial: true })
    await page.goto('/login')
    await enter(page, '90000001')
    await expect(page.getByRole('heading', { name: 'Elegí tu nueva contraseña' })).toBeVisible()
    expect(calls.some((call) => call.path === '/session/context')).toBeFalsy()
    await page.getByLabel('Nueva contraseña', { exact: true }).fill('a-new-test-password')
    await page.getByLabel('Confirmar contraseña').fill('mismatch')
    await page.getByRole('button', { name: 'Guardar contraseña' }).click()
    await expect(page.getByRole('alert')).toContainText('no coinciden')
    expect(calls.some((call) => call.path === '/auth/change-password')).toBeFalsy()
    await page.getByLabel('Confirmar contraseña').fill('a-new-test-password')
    await page.getByRole('button', { name: 'Guardar contraseña' }).click()
    await expect(page.getByRole('status')).toContainText('Contraseña actualizada')
    await enter(page, 'a-new-test-password')
    await expect(page).toHaveURL(/\/academy-demo\/admin$/)
})

test('invalid credentials show an error and a persisted demo flag grants no access', async ({ page }) => {
    await mockAPI(page, { denied: true })
    await page.addInitScript(() => localStorage.setItem('gestiq-demo-authenticated', 'true'))
    await page.goto('/academy-demo/admin')
    await expect(page).toHaveURL(/\/login\?organization=academy-demo$/)
    await enter(page)
    await expect(page.getByRole('alert')).toContainText('DNI o contraseña incorrectos')
    await expect(page.getByLabel('Contraseña', { exact: true })).toHaveValue('')
})

test('student cannot select administration or access another organization; reload ends session', async ({ page }) => {
    await mockAPI(page, { student: true })
    await page.goto('/login')
    await enter(page)
    await expect(page).toHaveURL(/\/academy-demo\/student$/)
    // SPA navigation preserves the in-memory session.
    await page.evaluate(() => { history.pushState({}, '', '/academy-demo/admin/academy'); dispatchEvent(new PopStateEvent('popstate')) })
    await expect(page).toHaveURL(/\/academy-demo\/student$/)
    await page.evaluate(() => { history.pushState({}, '', '/other/student'); dispatchEvent(new PopStateEvent('popstate')) })
    await expect(page.getByRole('alert')).toContainText('Sin acceso a esta academia')
    await page.getByRole('link', { name: 'Volver a mi academia' }).click()
    await expect(page).toHaveURL(/\/academy-demo\/student$/)
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Ingresá a tu academia' })).toBeVisible()
})

for (const dark of [false, true]) {
    test(`login and mandatory change fit mobile in ${dark ? 'dark' : 'light'} mode`, async ({ page }) => {
        await mockAPI(page, { initial: true })
        await page.setViewportSize({ width: 390, height: 844 })
        await page.addInitScript((value) => localStorage.setItem('gestiq-dark-mode', String(value)), dark)
        await page.goto('/login')
        await expect(page.getByRole('heading', { name: 'Ingresá a tu academia' })).toBeVisible()
        expect(await page.locator('html').evaluate((el) => el.classList.contains('dark'))).toBe(dark)
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
        await page.screenshot({ path: `test-results/login-${dark ? 'dark' : 'light'}.png` })
        await enter(page, '90000001')
        await expect(page.getByRole('heading', { name: 'Elegí tu nueva contraseña' })).toBeVisible()
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
        await page.screenshot({ path: `test-results/password-${dark ? 'dark' : 'light'}.png` })
    })
}

test('an administrator without owner permissions cannot open academy settings or the agenda', async ({ page }) => {
    await mockAPI(page, { branchAdmin: true })
    await page.goto('/login')
    await enter(page)
    await expect(page).toHaveURL(/\/academy-demo\/admin$/)
    await expect(page.getByRole('link', { name: 'Alumnos', exact: true })).toHaveCount(0)
    await page.evaluate(() => { history.pushState({}, '', '/academy-demo/admin/academy'); dispatchEvent(new PopStateEvent('popstate')) })
    await expect(page).toHaveURL(/\/academy-demo\/admin$/)
    await page.evaluate(() => { history.pushState({}, '', '/academy-demo/admin/schedule'); dispatchEvent(new PopStateEvent('popstate')) })
    await expect(page).toHaveURL(/\/academy-demo\/admin$/)
})
