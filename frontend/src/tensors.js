function inferShape(mda) {
    if (Array.isArray(mda)) {
        return [mda.length, ...inferShape(mda[0])]
    }

    return []
}

function defaultStrides(shape) {
    // Example: a000 a001 a002 a003 a010 a011 a012 a013 a020 a021 a022 a023 a100 a101 a102 a103 a110 a111 a112 a113 a120 a121 a122 a123.

    return shape // [2, 3, 4] ~> [12, 4, 1]
        .slice(1) // [3, 4]
        .reverse() // [4, 3]
        .reduce((acc, dim) => [dim * acc[0], ...acc], [1])
}

function dot(a, b) {
    const minLen = a.length <= b.length ? a.length : b.length
    let r = 0

    for (let i = 0; i < minLen; i++) {
        r += a[i] * b[i]
    }

    return r
}

function atIndex(index, strides, offset = 0) {
    return offset + dot(index, strides)
}

function flatten(arrays) {
    if (Array.isArray(arrays)) return arrays.flatMap(el => flatten(el))

    return arrays
}

export const Tensors = {
    fromArrays(data) {
        const shape = inferShape(data)

        return {
            shape,
            strides: defaultStrides(shape),
            offset: 0,
            data: flatten(data),
        }
    },
    reshape(newShape, { data }) {
        return {
            shape: newShape,
            strides: defaultStrides(newShape),
            offset: 0,
            data,
        }
    },
    at(index, { strides, offset, data }) {
        return data[atIndex(index, strides, offset)]
    },
    slice(index, sliceShape, { shape, strides, offset, data }) {
        shape.forEach((size, i) => {
            if (index[i] + sliceShape[i] > size) throw new Error(`slice out of bounds`)
        })

        if (offset > 0) throw new Error('cannot slice an already sliced tensor')

        return {
            shape: sliceShape,
            strides,
            offset: atIndex(index, strides),
            data,
        }
    },
    forEachIndex({ shape }, fn, index = []) {
        if (shape.length === 1) {
            for (let i = 0; i < shape[0]; i++) {
                fn(...index, i)
            }
        } else {
            for (let i = 0; i < shape[0]; i++) {
                Tensors.forEachIndex({ shape: shape.slice(1) }, fn, [...index, i])
            }
        }
    },
    toArrays(tensor) {
        const arr = []
        if (tensor.shape.length === 1) {
            for (let i = 0; i < shape[0]; i++) {
                arr.push(fn(...index, i))
            }
        } else {
            for (let i = 0; i < shape[0]; i++) {
                arr.push(Tensors.toArrays({ shape: tensor.shape.slice(1) }, fn, [...index, i]))
            }
        }
        return arr
    },
}
