import type { ComponentProps } from "preact"
import { css } from "preact-css-extract/comptime"
import { forwardRef } from "preact/compat"

export const AutosizeInput = forwardRef<
    HTMLTextAreaElement,
    { value: string; setValue?: (val: string) => void } & ComponentProps<"textarea">
>(({ value, setValue, ...textareaProps }, ref) => {
    const updateScrollHeight = (el: HTMLTextAreaElement | null) => {
        if (!el) return

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
                updateScrollHeight(el)

                if (typeof ref === "function") {
                    ref(el)
                } else if (ref) {
                    ref.current = el
                }
            }}
            class={css`
                resize: vertical;

                &:focus {
                    outline: none;
                }
            `}
            value={value}
            onInput={e => {
                updateScrollHeight(e.currentTarget)
                setValue?.(e.currentTarget.value)
            }}
            {...textareaProps}
        />
    )
})
