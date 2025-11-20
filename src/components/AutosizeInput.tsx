import type { Optic } from "@/lib/hooks"
import type { ComponentProps } from "preact"
import { css } from "preact-css-extract/comptime"
import { forwardRef, useRef } from "preact/compat"

/**
 * A textarea input that automatically resizes vertically to fit its content.
 */
export const AutosizeInput = forwardRef<
    HTMLTextAreaElement,
    ComponentProps<"textarea"> & {
        oValue: Optic<string>

        autoFocus?: boolean
    }
>(
    (
        {
            oValue,

            autoFocus = false,
            ...textareaProps
        },
        ref
    ) => {
        const inputRef = useRef<HTMLTextAreaElement>(null)

        const updateScrollHeight = () => {
            if (!inputRef.current) return
            const el = inputRef.current

            // force recalculation with zero height
            el.style.height = "0px"

            const scrollHeight = el.scrollHeight
            const elComputedStyles = getComputedStyle(el)
            const paddingTop = parseFloat(elComputedStyles.paddingTop)
            const paddingBottom = parseFloat(elComputedStyles.paddingBottom)

            el.style.height = `${scrollHeight - paddingTop - paddingBottom}px`
        }

        return (
            <textarea
                readOnly={oValue.isReadonly}
                ref={el => {
                    inputRef.current = el
                    updateScrollHeight()

                    if (autoFocus) {
                        el?.focus()
                    }

                    if (typeof ref === "function") {
                        ref(el)
                    } else if (ref) {
                        ref.current = el
                    }
                }}
                class={css`
                    box-sizing: content-box;
                    resize: vertical;
                    outline: none;
                `}
                value={oValue.get()}
                onInput={e => {
                    updateScrollHeight()
                    oValue.set(e.currentTarget.value)
                }}
                {...textareaProps}
            />
        )
    }
)
