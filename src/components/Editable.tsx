import { useClickOutside, useEventListener, type Optic } from "@/lib/hooks"
import { Icon } from "@iconify/react"
import { css } from "preact-css-extract/comptime"
import { useRef, useState } from "preact/hooks"

export const Editable = ({ oValue, inputClass }: { oValue: Optic<string>; inputClass?: string }) => {
    const [editing, setEditing] = useState<false | string>(false)

    const [spanHeight, setSpanHeight] = useState<number | null>(null)
    const spanRef = useRef<HTMLSpanElement>(null)

    const inputContainerRef = useRef<HTMLInputElement>(null)

    // global Escape handler to cancel editing
    useEventListener(window, "keydown", e => {
        if (e.key === "Escape" && editing !== false) {
            setEditing(false)
        }
    })

    useClickOutside(inputContainerRef, () => {
        setEditing(false)
    })

    return editing !== false ? (
        <div
            class={css`
                width: 100%;

                display: grid;
                gap: 0.25rem;
                grid-template-columns: 1fr auto;

                align-items: center;
            `}
            ref={inputContainerRef}
        >
            <input
                ref={el => {
                    el?.focus()
                }}
                value={editing}
                onInput={e => setEditing(e.currentTarget.value)}
                onKeyDown={e => {
                    if (e.key === "Enter") {
                        oValue.set(editing)
                        setEditing(false)
                    }
                }}
                classList={[
                    css`
                        font-family: "JetBrains Mono", monospace;
                        font-size: calc(14px * 0.85);
                        translate: 0 1px;
                        padding: 0;
                    `,
                    inputClass,
                ]}
                style={{
                    height: spanHeight ? `${spanHeight}px` : undefined,
                }}
                autoFocus
            />
            <button
                classList={[
                    "reset",
                    css`
                        background: hsl(120 20% 90%);
                        aspect-ratio: 1 / 1;
                        height: 0.75rem;
                        border-radius: 2rem;
                        padding: 3px;

                        display: grid;
                        place-items: center;

                        color: hsl(120 100% 30%);
                    `,
                ]}
                onClick={() => {
                    oValue.set(editing)
                    setEditing(false)
                }}
            >
                <Icon icon="ph:check-bold" height={12} />
            </button>
        </div>
    ) : (
        <span
            ref={spanRef}
            onClick={() => {
                if (oValue.isReadonly) return

                setEditing(oValue.get())
                setSpanHeight(spanRef.current?.offsetHeight || null)
            }}
            class={css`
                cursor: text;
            `}
        >
            {String(oValue.get())}
        </span>
    )
}
