import Papa from 'papaparse'

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

// Handle files from both drag and drop and file picker
export function parseCSV(file) {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            // headers: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: results => {
                resolve(results)
            },
            error: error => {
                reject(error)
            },
        })
    })
}
