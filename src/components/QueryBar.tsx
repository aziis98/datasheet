import { AutosizeInput } from "@/components/AutosizeInput"
import { Optic } from "@/lib/hooks"
import { forwardRef, type ComponentProps } from "preact/compat"

export const QueryBar = forwardRef<
    HTMLTextAreaElement,
    {
        query: string
        setQuery: (val: string) => void
    } & ComponentProps<"textarea">
>(({ query, setQuery, ...rest }, ref) => {
    return (
        <AutosizeInput
            {...rest}
            autoFocus={false}
            ref={ref}
            placeholder="Enter a new query..."
            oValue={Optic.of(query, u => setQuery(u(query)))}
            // disable autocorrect features for code input
            spellcheck={false}
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
        />
    )
})
