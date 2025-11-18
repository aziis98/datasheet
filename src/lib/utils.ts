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

export const tryEvaluate = (code: string): any | string => {
    try {
        const func = new Function(`return (${code})`)
        return func()
    } catch (e) {
        return (e as Error).message
    }
}
