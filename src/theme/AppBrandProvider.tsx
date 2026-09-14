import { useEffect, useState, type ReactNode } from 'react'
import {
    AppBrandContext,
    defaultAppBrandConfig,
    type AppBrandConfig,
} from './AppBrandContext.tsx'
import { applyAppBrandConfig } from './brandTheme'

type AppBrandProviderProps = {
    children: ReactNode
    initialConfig?: AppBrandConfig
}

export function AppBrandProvider({
    children,
    initialConfig = defaultAppBrandConfig,
}: AppBrandProviderProps) {
    const [config, setConfig] = useState<AppBrandConfig>(initialConfig)

    useEffect(() => {
        applyAppBrandConfig(config)
    }, [config])

    const value = {
        config,
        setConfig,
    }

    return <AppBrandContext.Provider value={value}>{children}</AppBrandContext.Provider>
}
