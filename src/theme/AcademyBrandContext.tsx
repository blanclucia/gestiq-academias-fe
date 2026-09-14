import { createContext, useContext } from 'react'
import { defaultAcademyBrand, type AcademyBrand } from './brandTheme'

export { defaultAcademyBrand, type AcademyBrand } from './brandTheme'

type AcademyBrandContextValue = {
    brand: AcademyBrand
    setBrand: (brand: AcademyBrand) => void
}

export const AcademyBrandContext = createContext<AcademyBrandContextValue>({
    brand: defaultAcademyBrand,
    setBrand: () => undefined,
})

export function useAcademyBrand() {
    return useContext(AcademyBrandContext)
}
