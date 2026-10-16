import { useLayoutEffect, useState, type CSSProperties, type RefObject } from 'react'

const gap = 5
const viewportMargin = 16

// Positions a dropdown panel that is portaled to document.body (so an overflow:auto ancestor such as
// EntityFormModal can't clip it) right under its anchor — or above it when there's no room below —
// and keeps it attached while the page or any scroll container moves.
export function useFloatingPanel(anchorRef: RefObject<HTMLElement | null>, open: boolean, maxHeight = 220): CSSProperties | undefined {
    const [style, setStyle] = useState<CSSProperties>()

    useLayoutEffect(() => {
        if (!open) return
        const place = () => {
            const rect = anchorRef.current?.getBoundingClientRect()
            if (!rect) return
            const spaceBelow = window.innerHeight - rect.bottom
            const openUp = spaceBelow < maxHeight + viewportMargin && rect.top > spaceBelow
            setStyle({
                position: 'fixed',
                zIndex: 200,
                left: rect.left,
                right: 'auto',
                width: rect.width,
                ...(openUp ? { top: 'auto', bottom: window.innerHeight - rect.top + gap } : { top: rect.bottom + gap, bottom: 'auto' }),
            })
        }
        place()
        window.addEventListener('resize', place)
        window.addEventListener('scroll', place, true)
        return () => {
            window.removeEventListener('resize', place)
            window.removeEventListener('scroll', place, true)
        }
    }, [anchorRef, open, maxHeight])

    return open ? style : undefined
}
