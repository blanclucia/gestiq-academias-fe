import { useAppBrand } from '@/theme/AppBrandContext'

// "Plataforma desarrollada por GestIQ →": product credit on screens people outside the academy see
// (login, public enrollment form) — the way prospective clients discover the platform.
export function PlatformCredit() {
    const { config } = useAppBrand()
    return <div className="platform-credit"><span>Plataforma desarrollada por</span><a href={config.websiteUrl} target="_blank" rel="noreferrer">{config.platformName} →</a></div>
}
