export type AcademyBrand = {
    name: string
    shortName?: string
    logoDataUrl?: string
    primary: string
    primaryStrong: string
    primarySoft: string
    primaryContrast: string
    accent?: string
}

export type AppBrandConfig = {
    platformName: string
    websiteUrl?: string
    visibleName: string
    shortName?: string
    logoText?: string
}

export const defaultAcademyBrand: AcademyBrand = {
    name: 'Academia Puentes',
    shortName: 'AP',
    primary: '#4f46e5',
    primaryStrong: '#3730a3',
    primarySoft: '#4f46e524',
    primaryContrast: '#ffffff',
    accent: '#22c55e',
}

export const defaultAppBrandConfig: AppBrandConfig = {
    platformName: 'GestIQ',
    websiteUrl: 'https://gestiq.com.ar',
    visibleName: 'GestIQ - Academias',
    shortName: 'G',
    logoText: 'G',
}

export function applyAcademyBrand(brand: AcademyBrand = defaultAcademyBrand) {
    const root = document.documentElement

    root.style.setProperty('--brand-name', brand.name)
    root.style.setProperty('--brand-short-name', brand.shortName ?? brand.name.slice(0, 2).toUpperCase())
    root.style.setProperty('--primary', brand.primary)
    root.style.setProperty('--primary-strong', brand.primaryStrong)
    root.style.setProperty('--primary-soft', brand.primarySoft)
    root.style.setProperty('--primary-contrast', brand.primaryContrast)

    if (brand.accent) {
        root.style.setProperty('--accent', brand.accent)
    }
}

export function applyAppBrandConfig(config: AppBrandConfig = defaultAppBrandConfig) {
    const root = document.documentElement

    root.style.setProperty('--platform-name', config.platformName)
    root.style.setProperty('--platform-website-url', config.websiteUrl ?? 'https://gest-ia.com.ar')
    root.style.setProperty('--visible-brand-name', config.visibleName)
    root.style.setProperty('--brand-short-name', config.shortName ?? config.visibleName.slice(0, 2).toUpperCase())
    root.style.setProperty('--logo-text', config.logoText ?? config.visibleName.charAt(0).toUpperCase())
}

// The real brand only arrives after the session refresh and the settings request, so the default
// purple would flash on every reload. The last known colors are cached (colors only — a logo data
// URL can weigh up to 1 MB) and applied before the first render, like the dark mode flag.
const brandColorsCacheKey = 'gestiq-academy-brand-colors'

type BrandColors = Pick<AcademyBrand, 'primary' | 'primaryStrong' | 'primarySoft' | 'primaryContrast' | 'accent'>
type CachedBrandColors = { organizationId: string; colors: BrandColors }

function readBrandColorsCache(): CachedBrandColors | null {
    try {
        const cached = JSON.parse(window.localStorage.getItem(brandColorsCacheKey) ?? 'null') as CachedBrandColors | null
        return cached?.organizationId && cached.colors?.primary ? cached : null
    } catch {
        return null
    }
}

// Without an organization id (session still loading) the last organization's colors are the best guess.
export function readCachedBrandColors(organizationId?: string): Partial<BrandColors> {
    const cached = readBrandColorsCache()
    if (!cached || (organizationId && cached.organizationId !== organizationId)) return {}
    return cached.colors
}

export function cacheBrandColors(organizationId: string, { primary, primaryStrong, primarySoft, primaryContrast, accent }: AcademyBrand) {
    try {
        window.localStorage.setItem(brandColorsCacheKey, JSON.stringify({ organizationId, colors: { primary, primaryStrong, primarySoft, primaryContrast, accent } }))
    } catch {
        // Storage can be unavailable (private mode, quota); the brand still applies once settings load.
    }
}

export function applyCachedBrandColors() {
    const colors = readCachedBrandColors()
    if (colors.primary) applyAcademyBrand({ ...defaultAcademyBrand, ...colors })
}

