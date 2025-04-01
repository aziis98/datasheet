const removeEntry = Symbol('remove')

export function matchTraverseObject(obj, predicate, replacement, path = []) {
    if (predicate(obj, path)) {
        return typeof replacement === 'function' ? replacement(obj) : replacement
    }

    if (Array.isArray(obj)) {
        return obj.flatMap((item, index) => {
            const newItem = matchTraverseObject(item, predicate, replacement, [...path, index])
            if (newItem === removeEntry) {
                return []
            }

            return [newItem]
        })
    }

    if (typeof obj === 'object' && obj !== null) {
        const newObj = {}
        for (const key in obj) {
            const newValue = matchTraverseObject(obj[key], predicate, replacement, [...path, key])
            if (newValue === removeEntry) {
                continue
            }

            newObj[key] = newValue
        }
        return newObj
    }

    return obj
}

matchTraverseObject.remove = removeEntry
