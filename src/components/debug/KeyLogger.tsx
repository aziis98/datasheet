import { useKeyPress } from "@/lib/hooks"
import { css } from "preact-css-extract/comptime"

export const Key = ({ name }: { name: string }) => {
    const isKeyPressed = useKeyPress(e => e.key === name)

    if (!isKeyPressed) {
        return null
    }

    return (
        <div
            class={css`
                display: grid;
                place-items: center;

                padding: 0.25rem 0.5rem;
                border-radius: 0.5rem;
                opacity: 0.75;

                background: #111;
                color: #fff;

                font-family: "JetBrains Mono Variable", monospace;
                font-size: 15px;
            `}
        >
            {name}
        </div>
    )
}

export const KeyLogger = ({}) => {
    return (
        <div
            class={css`
                position: fixed;
                bottom: 1rem;
                left: 1rem;

                z-index: 1000;
            `}
        >
            <Key name="Shift" />
        </div>
    )
}
