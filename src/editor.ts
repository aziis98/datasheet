const historyStack: string[] = []
let clipboard = ''

export const DEFAULT_CONFIG = {
    tabSize: 2,
}

export type EditorConfig = typeof DEFAULT_CONFIG

export function applyTextEditorBehavior(e: KeyboardEvent, config: EditorConfig = DEFAULT_CONFIG): string | null {
    const $editor = e.currentTarget as HTMLTextAreaElement
    const origText = $editor.value
    const selectionStart = $editor.selectionStart
    const selectionEnd = $editor.selectionEnd
    const selectionDirection = $editor.selectionDirection

    function pushHistory(state: string) {
        if (!historyStack.length || historyStack[historyStack.length - 1] !== state) {
            historyStack.push(state)
        }
    }

    // Undo (Ctrl+Z)
    if (e.ctrlKey && e.key.toLowerCase() === 'z') {
        if (historyStack.length) {
            const prev = historyStack.pop()!
            e.preventDefault()
            $editor.value = prev
            $editor.setSelectionRange(prev.length, prev.length, 'none')
            return prev
        }
        return null
    }

    // Copy (Ctrl+C)
    if (e.ctrlKey && e.key.toLowerCase() === 'c') {
        if (selectionStart !== selectionEnd) {
            clipboard = origText.slice(selectionStart, selectionEnd)
        }
        return null
    }

    // Cut (Ctrl+X)
    if (e.ctrlKey && e.key.toLowerCase() === 'x') {
        if (selectionStart !== selectionEnd) {
            pushHistory(origText)
            clipboard = origText.slice(selectionStart, selectionEnd)
            const newText = origText.slice(0, selectionStart) + origText.slice(selectionEnd)
            e.preventDefault()
            $editor.value = newText
            $editor.setSelectionRange(selectionStart, selectionStart, selectionDirection)
            return newText
        }
        return null
    }

    // Paste (Ctrl+V)
    if (e.ctrlKey && e.key.toLowerCase() === 'v') {
        pushHistory(origText)
        const newText = origText.slice(0, selectionStart) + clipboard + origText.slice(selectionEnd)
        e.preventDefault()
        $editor.value = newText
        const newPos = selectionStart + clipboard.length
        $editor.setSelectionRange(newPos, newPos, selectionDirection)
        return newText
    }

    // Handle Tab and Shift+Tab for indentation.
    if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey) {
        pushHistory(origText)
        e.preventDefault()
        const indent = ' '.repeat(config.tabSize)

        // Expand selection to full lines.
        let blockStart = selectionStart
        while (blockStart > 0 && origText[blockStart - 1] !== '\n') {
            blockStart--
        }
        let blockEnd = selectionEnd
        while (blockEnd < origText.length && origText[blockEnd] !== '\n') {
            blockEnd++
        }
        const origBlock = origText.slice(blockStart, blockEnd)
        const origLines = origBlock.split('\n')

        // For recalculating new selection positions we need the original block-relative offsets.
        const relativeStart = selectionStart - blockStart
        const relativeEnd = selectionEnd - blockStart

        let newLines: string[]
        // For unindent, we record per-line removal counts.
        const removed: number[] = []

        if (e.shiftKey) {
            // Unindent each line precisely.
            newLines = origLines.map(line => {
                const match = line.match(/^ {0,}/)
                const removeCount = Math.min(config.tabSize, match ? match[0].length : 0)
                removed.push(removeCount)
                return line.slice(removeCount)
            })
        } else {
            // Indent: prepend indent to every line.
            newLines = origLines.map(line => {
                removed.push(0)
                return indent + line
            })
        }

        const newBlock = newLines.join('\n')
        const newText = origText.slice(0, blockStart) + newBlock + origText.slice(blockEnd)
        $editor.value = newText

        // Recalculate selection positions.
        if (!e.shiftKey) {
            // For indent: every line in the block gets a full indent added.
            // Determine on which line the original selectionStart and selectionEnd fall.
            function calcNewPos(origRel: number): number {
                let cumulative = 0
                let lineIdx = 0
                for (let i = 0; i < origLines.length; i++) {
                    const lineLen = origLines[i]!.length
                    if (origRel <= cumulative + lineLen) {
                        lineIdx = i
                        break
                    }
                    cumulative += lineLen + 1 // include newline
                }
                // Each line in the block gets indent inserted.
                return blockStart + origRel + config.tabSize * (lineIdx + 1)
            }
            const newSelectionStart = calcNewPos(relativeStart)
            const newSelectionEnd = calcNewPos(relativeEnd)
            $editor.setSelectionRange(newSelectionStart, newSelectionEnd, selectionDirection)
        } else {
            // For unindent: subtract the exact number of removed characters per line.
            function calcNewPos(origRel: number): number {
                let cumulativeOrig = 0
                let cumulativeRemoved = 0
                for (let i = 0; i < origLines.length; i++) {
                    const lineLen = origLines[i]!.length
                    if (origRel <= cumulativeOrig + lineLen) {
                        // In current line, remove up to the removed count.
                        const col = origRel - cumulativeOrig
                        const removedHere = Math.min(col, removed[i]!)
                        return blockStart + origRel - (cumulativeRemoved + removedHere)
                    }
                    cumulativeOrig += lineLen + 1
                    cumulativeRemoved += removed[i]!
                }
                return blockStart + origRel - cumulativeRemoved
            }
            const newSelectionStart = calcNewPos(relativeStart)
            const newSelectionEnd = calcNewPos(relativeEnd)
            $editor.setSelectionRange(newSelectionStart, newSelectionEnd, selectionDirection)
        }
        return newText
    }

    return null
}
