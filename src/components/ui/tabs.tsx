import {
    type ButtonHTMLAttributes,
    type HTMLAttributes,
    createContext,
    useContext,
    useMemo,
    useState,
} from 'react'

type TabsContextValue = {
    value: string
    onValueChange: (value: string) => void
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabsContext() {
    const context = useContext(TabsContext)

    if (!context) {
        throw new Error('Tabs components must be used within Tabs')
    }

    return context
}

type TabsProps = {
    value?: string
    defaultValue?: string
    onValueChange?: (value: string) => void
    children: React.ReactNode
} & HTMLAttributes<HTMLDivElement>

export function Tabs({
    value,
    defaultValue = '',
    onValueChange,
    children,
    className = '',
    ...props
}: TabsProps) {
    const [internalValue, setInternalValue] = useState(defaultValue)
    const currentValue = value ?? internalValue

    const contextValue = useMemo(
        () => ({
            value: currentValue,
            onValueChange: (nextValue: string) => {
                if (value === undefined) {
                    setInternalValue(nextValue)
                }

                onValueChange?.(nextValue)
            },
        }),
        [currentValue, onValueChange, value],
    )

    return (
        <TabsContext.Provider value={contextValue}>
            <div className={className} {...props}>
                {children}
            </div>
        </TabsContext.Provider>
    )
}

type TabsListProps = {
    variant?: 'line'
    children: React.ReactNode
} & HTMLAttributes<HTMLDivElement>

export function TabsList({ variant = 'line', className = '', children, ...props }: TabsListProps) {
    return (
        <div
            role="tablist"
            aria-orientation="horizontal"
            className={`tabs-list tabs-list--${variant} ${className}`.trim()}
            {...props}
        >
            {children}
        </div>
    )
}

type TabsTriggerProps = {
    value: string
} & ButtonHTMLAttributes<HTMLButtonElement>

export function TabsTrigger({ value, className = '', children, ...props }: TabsTriggerProps) {
    const { value: selectedValue, onValueChange } = useTabsContext()
    const isActive = selectedValue === value

    return (
        <button
            type="button"
            role="tab"
            aria-selected={isActive}
            data-state={isActive ? 'active' : 'inactive'}
            className={`tabs-trigger ${isActive ? 'tabs-trigger--active' : ''} ${className}`.trim()}
            onClick={() => onValueChange(value)}
            {...props}
        >
            {children}
        </button>
    )
}
