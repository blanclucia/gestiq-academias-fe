import { createContext, useContext } from 'react'
import { defaultAppBrandConfig, type AppBrandConfig } from './brandTheme'

export { defaultAppBrandConfig, type AppBrandConfig } from './brandTheme'

type AppBrandContextValue = {
    config: AppBrandConfig
    setConfig: (config: AppBrandConfig) => void
}

export const AppBrandContext = createContext<AppBrandContextValue>({
    config: defaultAppBrandConfig,
    setConfig: () => undefined,
})

export function useAppBrand() {
    return useContext(AppBrandContext)
}
