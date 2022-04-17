import ndarray from 'ndarray'
import pack from 'ndarray-pack'
import unpack from 'ndarray-unpack'

import ops, { exp } from 'ndarray-ops'
import linspace from 'ndarray-linspace'
import zeros from 'zeros'
import fill from 'ndarray-fill'

// DEBUG: Made global to use in devtools
window.ndarray = ndarray
window.pack = pack
window.unpack = unpack
window.ops = ops
window.zeros = zeros
window.fill = fill
window.linspace = linspace

function inferShape(arr) {
    const shape = []
    let c = arr
    let size = 1

    while (Array.isArray(c)) {
        shape.push(c.length)
        size *= c.length
        c = c[0]
    }

    return { size, shape }
}

export const Tensors = {
    ndarray,
    fromArrays(arr) {
        // creates an ndarray backed by a classic array instead of a Float64Array
        const { size, shape } = inferShape(arr)
        return pack(arr, ndarray(Array.from({ length: size }), shape))
    },
    slice(offset, shape, tensor) {
        return tensor.lo(...offset).hi(shape)
    },
    plane(fn, tensor) {
        return tensor.pick(...fn(...Array.from({ length: tensor.shape }, () => null)))
    },
    // so you can write transpose((i, j) => [j, i], tensor)
    transpose(fn, tensor) {
        return tensor.transpose(...fn(...Arrays.indices(tensor.shape)))
    },
    toArrays(nd) {
        return unpack(nd)
    },
}

window.Tensors = Tensors

export const Arrays = {
    range(low, high, step = 1) {
        return Array.from({ length: Math.round((high - low) / step) + 1 }, (_, i) => i * step + low)
    },
    indices(arr) {
        return Array.prototype.map.call(Array.from(arr), (_, i) => i)
    },
}

window.Arrays = Arrays
