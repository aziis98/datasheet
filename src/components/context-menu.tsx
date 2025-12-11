import { useClickOutside } from "@/lib/hooks"
import { Icon } from "@iconify/react"
import { createContext, type ComponentChildren, type ComponentType } from "preact"
import { css } from "preact-css-extract/comptime"
import { useContext, useRef, useState } from "preact/hooks"

export const ContextMenuCtx = createContext<{
    position?: { x: number; y: number }
    setPosition?: (position: { x: number; y: number } | undefined) => void

    RootComponent?: ComponentType
    setRootComponent?: (component: ComponentType | undefined) => void

    props?: any
    setProps?: (props: any) => void

    closeMenu?: () => void
}>({})

export const ContextMenuProvider = ({ children }: { children: ComponentChildren }) => {
    const [position, setPosition] = useState<{ x: number; y: number } | undefined>(undefined)
    const [RootComponent, setRootComponent] = useState<ComponentType | undefined>(undefined)
    const [props, setProps] = useState<any>(undefined)

    const closeMenu = () => {
        setRootComponent(undefined)
        setPosition(undefined)
        setProps(undefined)
    }

    return (
        <ContextMenuCtx.Provider
            value={{
                position,
                setPosition,
                RootComponent,
                setRootComponent,
                props,
                setProps,
                closeMenu,
            }}
        >
            {children}
        </ContextMenuCtx.Provider>
    )
}

export const ContextMenuOverlay = ({}) => {
    const containerRef = useRef<HTMLDivElement>(null)

    const { position, RootComponent, props, closeMenu } = useContext(ContextMenuCtx)
    if (!RootComponent) {
        return null
    }

    useClickOutside(containerRef, () => closeMenu?.())

    return (
        <div
            ref={containerRef}
            class={css`
                position: absolute;
                z-index: 2;
            `}
            style={{
                top: position?.y + "px",
                left: position?.x + "px",
            }}
        >
            <ContextMenuContainer>
                <RootComponent {...props} />
            </ContextMenuContainer>
        </div>
    )
}

export const useContextMenu = () => {
    const { setPosition, setRootComponent, setProps, closeMenu } = useContext(ContextMenuCtx)

    const showContextMenu = <P,>(e: MouseEvent, component: ComponentType<P>, props: P) => {
        e.preventDefault()
        setPosition?.({ x: e.pageX, y: e.pageY })
        setRootComponent?.(() => component)
        setProps?.(props)
    }

    return {
        showContextMenu,
        closeMenu,
    }
}

const ContextMenuContainer = ({ children }: { children: ComponentChildren }) => {
    return (
        <div
            classList={[
                "card",
                "grid-v",
                css`
                    grid-template-columns: auto 1fr;
                    grid-auto-rows: auto;

                    > .title {
                        /* min-height: 1.5rem; */
                        padding: 0.125rem 0.5rem;
                        font-weight: 600;
                        font-size: 14px;

                        display: grid;
                        align-items: center;

                        grid-column: span 2;
                    }
                `,
            ]}
        >
            {children}
        </div>
    )
}

export const ContextMenuSeparator = () => {
    return (
        <div
            class={css`
                grid-column: span 2;

                height: 1px;
                background: var(--border);
            `}
        ></div>
    )
}

export const ContextMenuItem = ({
    icon,
    label,
    onClick,
    children,
}: {
    icon?: string
    label: string

    onClick?: () => void
    children?: ComponentChildren
}) => {
    const { closeMenu } = useContext(ContextMenuCtx)

    return (
        <div
            classList={[
                "grid-fill",
                css`
                    grid-column: span 2;
                    grid-template-columns: subgrid;

                    min-height: 1.5rem;
                `,
            ]}
            onClick={() => {
                onClick?.()
                closeMenu?.()
            }}
        >
            <div
                classList={[
                    "grid-h",
                    css`
                        padding: 0 0.5rem;
                        font-size: 14px;

                        &:hover {
                            background: var(--bg-hover);
                            cursor: pointer;
                        }
                    `,
                ]}
            >
                {icon && <Icon icon={icon} height={14} />}
                <div class="label">{label}</div>
            </div>
            {children && <ContextMenuContainer>{children}</ContextMenuContainer>}
        </div>
    )
}
