import ndarray from 'ndarray'
import unpack from 'ndarray-unpack'
import zeros from 'zeros'
import { Arrays, Tensors } from '../../tensors.js'

function slice(tensor, axis, offset) {
    return tensor.pick(...tensor.shape.map((_, i) => (i === axis ? offset : null)))
}

function accumulate(arr, fn = (a, b) => a + b) {
    const res = arr.slice(0, 1)

    for (let i = 1; i < arr.length; i++) {
        res.push(fn(res[i - 1], arr[i]))
    }

    return res
}

function toTableView(tensor, viewIndices, sliceIndices) {
    const { slices, rows, columns } = viewIndices
    const { shape, size } = tensor

    const rowCount = rows.map(axis => tensor.shape[axis]).reduce((acc, v) => acc * v)
    const columnCount = columns.map(axis => tensor.shape[axis]).reduce((acc, v) => acc * v)

    const resultTensor = zeros([rowCount, columnCount], 'array')

    const rowDivisors = Array.from({ length: tensor.shape.length })
    let rowAcc = 1
    ;[...rows].reverse().forEach(axis => {
        rowDivisors[axis] = rowAcc
        rowAcc *= tensor.shape[axis]
    })

    const colDivisors = Array.from({ length: tensor.shape.length })
    let colAcc = 1
    ;[...columns].reverse().forEach(axis => {
        colDivisors[axis] = colAcc
        colAcc *= tensor.shape[axis]
    })

    const sliceIndex = Array.from({ length: tensor.shape.length })
    slices.forEach((axis, i) => {
        sliceIndex[axis] = sliceIndices[i]
    })

    console.log(`rowDivisors = `, rowDivisors)
    console.log(`colDivisors = `, colDivisors)
    console.log(`sliceIndex = `, sliceIndex)

    for (let i = 0; i < rowCount; i++) {
        for (let j = 0; j < columnCount; j++) {
            // const rowIndices = tensor.shape.map(size => (((i * size) / rowCount) | 0) % size)
            // const columnIndices = tensor.shape.map(size => (((i * size) / columnCount) | 0) % size)
            // rows = [0, 1] ~> rowIndices = [i * N / Size % Size, i * NM / Size % Size]
            // Inputs: size=[N, M, K], rows=[0,1]
            // ~> i = 0 .. NM
            // ~> rowIndex=[intdiv(i, M) % N, intdiv(i, 1) % M, ???]
            // ~> [N, M] ~> [NK, M] ~> complement by NM ~> [M, 1, _]
            // Inputs: size=[N, M, K], rows=[1,0]
            // ~> i = 0 .. NM
            // ~> rowIndex=[intdiv(i, 1) % N, intdiv(i, N) % M, ???]
            // ~> [M, N] ~> [M, MN] ~> complement by NM ~> [1, N, _]
            // Inputs: size=[N, M, K, P], rows=[0,1,2,3]
            // ~> i = 0 .. NMKP
            // ~> rowIndex=[intdiv(i, MKP) % N, intdiv(i, KP) % M, intdiv(i, P) % K, i % P]
            // Inputs: size=[N, M, K, P], rows=[0,2,1,3]
            // ~> i = 0 .. NMKP
            // ~> rowIndex=[intdiv(i, MKP) % N, intdiv(i, P) % M, intdiv(i, MP) % K, i % P]
            // console.log(
            //     accumulate(rows.map(axis => tensor.shape[axis]).reverse(), (a, b) => a * b).map(axis => )
            // )

            const applyDivisor = index => (div, axis) =>
                div !== null ? ((index / div) | 0) % tensor.shape[axis] : null

            resultTensor.set(
                i,
                j,
                tensor.get(
                    ...zip(
                        (a, b, c) => a || b || c,
                        sliceIndex,
                        rowDivisors.map(applyDivisor(i)),
                        colDivisors.map(applyDivisor(j))
                    )
                )
            )
        }
    }

    return unpack(resultTensor)
}

function zip(fn, ...arrs) {
    return arrs[0].map((_, i) => fn(...arrs.map((_, j) => arrs[j][i])))
}

// tensor :: N x M x K

// slices: [0], rows: [1], columns: [2]; with slice offset array: [0]
// i = 0 .. M, j = 0 .. K ~> tensor[0][i][j]

// slices: [], rows: [0,1,2], columns: []; with slice offset array: []
// i = 0 .. NMK ~> tensor[i / MK][i / K % M][i % K]

// i = 0 .. product(view.rows.map(axis => tensor.shape[axis]))
// j = 0 .. product(view.columns.map(axis => tensor.shape[axis]))

console.log(
    toTableView(
        ndarray(Arrays.range(1, 60), [2, 3, 5]),
        {
            slices: [],
            rows: [0, 1],
            columns: [2],
        },
        [0]
    )
)

export const TensorBlock = ({ categories, headers, view, tensor }) => {
    const { slices, rows, columns } = view

    // 2d-array of cells to render
    const cells = Tensors.toArrays(Tensors.plane((x, y, z) => [x, y, 0], tensor))
    const rowCount = tensor.shape[0]
    const columnCount = tensor.shape[1]

    return (
        <div class="tensor">
            <div class="grid" style={{ '--rows': rowCount, '--columns': columnCount }}>
                <div class="todo-box"></div>
                <div class="data">
                    {cells.map(row => row.map(cell => <div class="cell">{cell}</div>))}
                </div>
            </div>
        </div>
    )
}
