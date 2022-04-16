import { Tensors } from '../../tensors.js'

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
