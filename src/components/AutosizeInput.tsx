import type { ComponentProps } from "preact"
import { css } from "preact-css-extract/comptime"
import { forwardRef, useRef } from "preact/compat"

export const AutosizeInput = forwardRef<
    HTMLTextAreaElement,
    ComponentProps<"textarea"> & { value: string; setValue?: (val: string) => void }
>(({ value, setValue, ...textareaProps }, ref) => {
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
            ref={el => {
                inputRef.current = el
                updateScrollHeight()

                if (typeof ref === "function") {
                    ref(el)
                } else if (ref) {
                    ref.current = el
                }
            }}
            class={css`
                box-sizing: content-box;
                resize: vertical;

                &:focus {
                    outline: none;
                }
            `}
            value={value}
            onInput={e => {
                updateScrollHeight()
                setValue?.(e.currentTarget.value)
            }}
            {...textareaProps}
        />
    )
})
