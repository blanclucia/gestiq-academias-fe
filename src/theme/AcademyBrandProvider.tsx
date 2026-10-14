import { useLayoutEffect, useState, type ReactNode } from 'react'
import {
    AcademyBrandContext,
    defaultAcademyBrand,
    type AcademyBrand,
} from './AcademyBrandContext.tsx'
import { applyAcademyBrand } from './brandTheme'

type AcademyBrandProviderProps = {
    children: ReactNode
    initialBrand?: AcademyBrand
}

export function AcademyBrandProvider({
    children,
    initialBrand = defaultAcademyBrand,
}: AcademyBrandProviderProps) {
    const [brand, setBrand] = useState<AcademyBrand>(initialBrand)

    // Layout effect: apply before paint so a remount never shows the previous colors for a frame.
    useLayoutEffect(() => {
        applyAcademyBrand(brand)
    }, [brand])

    const value = {
        brand,
        setBrand,
    }

    return <AcademyBrandContext.Provider value={value}>{children}</AcademyBrandContext.Provider>
}
