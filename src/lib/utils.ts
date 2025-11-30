export const dedent = (source: string) =>
    source
        .trim()
        .replace(/^\s+/gm, "")
        .replace(/([^\n])\n([^\n])/g, "$1 $2")

export const arrayRepeat = <T>(items: T[], count: number): T[] => {
    const result: T[] = []
    for (let i = 0; i < count; i++) {
        result.push(...items)
    }
    return result
}

export type TryEvaluateResponse = {
    value?: unknown
    error?: string
    elapsedMs: number
}

export const tryEvaluate = (code: string, context: Record<string, any> = {}): TryEvaluateResponse => {
    const trimmedCode = code.trim()
    if (!trimmedCode) return { value: undefined, elapsedMs: 0 }

    const contextKeys = Object.keys(context ?? {})
    const contextValues = Object.values(context ?? {})
    const start = performance.now()

    try {
        // Create a new function with the context keys as parameters
        const func = new Function(...contextKeys, `return (${trimmedCode})`)

        const result = func(...contextValues)
        const elapsedMs = performance.now() - start

        return { value: result, elapsedMs }
    } catch (e) {
        const elapsedMs = performance.now() - start
        console.log("Error evaluating code:", trimmedCode)
        return {
            error: `Error: ${(e as Error).message}`,
            elapsedMs,
        }
    }
}

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export const formatDuration = (ms: number): string => {
    const seconds = Math.floor((ms / 1000) % 60)
    const minutes = Math.floor((ms / (1000 * 60)) % 60)
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24)
    const days = Math.floor(ms / (1000 * 60 * 60 * 24))

    const parts = []
    if (days > 0) parts.push(`${days}d`)
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    if (seconds > 0) parts.push(`${seconds}s`)

    return parts.join(" ") || "0s"
}
