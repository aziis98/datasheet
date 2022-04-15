function mergeIndents(a, b) {
    if (!a) return b
    if (!b) return a

    const minLen = a.length <= b.length ? a.length : b.length

    let merged = ''

    for (let i = 0; i < minLen; i++) {
        if (a[i] === b[i]) {
            merged += a[i]
        } else {
            return merged
        }
    }

    return merged
}

export function dedent(s) {
    const lines = s.split('\n')

    while (lines[0].trim().length === 0) {
        lines.shift()
    }

    while (lines[lines.length - 1].trim().length === 0) {
        lines.pop()
    }

    let longestIndent = null

    lines.forEach(line => {
        const [indent] = line.match(/^[ \t]*/)

        // black indent are fine as blank lines are already removed at the start but after that empty lines are skipped
        if (longestIndent !== null || indent.length > 0) {
            longestIndent = mergeIndents(longestIndent, indent)
        }
    })

    console.log(longestIndent.length)

    return lines.map(l => (l.length > 0 ? l.slice(longestIndent.length) : l)).join('\n')
}
