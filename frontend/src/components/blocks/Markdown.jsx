import { useState } from 'preact/hooks'

const stringListReplacer = (regex, replacer) => s => {
    // To use inside "flatMap" this skips replacing non string nodes
    if (typeof s !== 'string') {
        return s
    }

    // Add 'g' flag to make calls to "exec" advance ".lastIndex" inside the RegExp
    const flags = new Set(...regex.flags)
    flags.add('g')
    const globalRegex = new RegExp(regex.source, [...flags].join(''))

    const result = []
    let match
    let lastIndex = 0

    while ((match = globalRegex.exec(s))) {
        result.push(s.slice(lastIndex, match.index))
        result.push(replacer(...match))

        lastIndex = match.index + match[0].length
    }

    if (lastIndex < s.length) {
        result.push(s.slice(lastIndex))
    }

    return result
}

const SimpleMarkdownInline = ({ source }) => {
    let text = [source]

    text = text.flatMap(stringListReplacer(/_(.+?)_/, (_, inside) => <i>{inside}</i>))
    text = text.flatMap(stringListReplacer(/\*(.+?)\*/, (_, inside) => <b>{inside}</b>))
    text = text.flatMap(stringListReplacer(/~(.+?)~/, (_, inside) => <s>{inside}</s>))

    return text
}

const SimpleMarkdownBlock = ({ source }) => {
    // Headings
    const headings = source.match(/^\#+/)
    if (headings) {
        const level = headings[0].length
        const HeadingLevel = `h${level}`

        return (
            <HeadingLevel>
                <SimpleMarkdownInline source={source.slice(level)} />
            </HeadingLevel>
        )
    }

    return (
        <p>
            <SimpleMarkdownInline source={source} />
        </p>
    )
}

export const MarkdownBlock = ({ source, setBlockValue }) => {
    const [editing, setEditing] = useState(false)
    const setSource = source => {
        setBlockValue({ source })
    }

    return (
        <div class="markdown" onClick={e => !editing && e.detail === 2 && setEditing(true)}>
            {!editing && source.split(/\n\n/).map(block => <SimpleMarkdownBlock source={block} />)}
            {editing && (
                <textarea
                    cols="80"
                    rows="10"
                    value={source}
                    onInput={e => setSource(e.target.value)}
                    onBlur={() => setEditing(false)}
                    onKeyDown={e => e.key === 'Escape' && setEditing(false)}
                ></textarea>
            )}
        </div>
    )
}
