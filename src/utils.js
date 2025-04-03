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
            skipEmptyLines: true,
            complete: results => {
                const [headers, ...rows] = results.data

                // convert values to numbers only if the whole column is numeric
                const isNumeric = s => /^\d+(\.\d+)?$/.test(s)

                headers.forEach((header, index) => {
                    if (rows.every(row => isNumeric(row[index]))) {
                        rows.forEach(row => {
                            row[index] = Number(row[index])
                        })
                    }
                })

                resolve({ headers, rows })
            },
            error: error => {
                reject(error)
            },
        })
    })
}
