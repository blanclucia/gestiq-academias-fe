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
    primarySoft: 'rgba(79, 70, 229, 0.14)',
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
