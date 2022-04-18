import ndarray from 'ndarray'
import unpack from 'ndarray-unpack'
import { useEffect, useRef, useState } from 'preact/hooks'
import zeros from 'zeros'
import { useDragAndDrop } from '../../hooks.js'
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

    const rowCount = rows.map(axis => tensor.shape[axis]).reduce((acc, v) => acc * v, [1])
    const columnCount = columns.map(axis => tensor.shape[axis]).reduce((acc, v) => acc * v, [1])

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

    for (let i = 0; i < rowCount; i++) {
        for (let j = 0; j < columnCount; j++) {
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

    return resultTensor
}

function zip(fn, ...arrs) {
    return arrs[0].map((_, i) => fn(...arrs.map((_, j) => arrs[j][i])))
}

function invertCategoryMap(map) {
    const res = {}
    Object.entries(map).forEach(([key, value]) => {
        res[value] = Number(key)
    })
    return res
}

function clamp(min, value, max) {
    return value < min ? min : value > max ? max : value
}

const SliceAxisComponent = ({ slices, headers, sliceIndices, setSliceIndices, dnd }) => {
    const { dragging, dragBeginProps, dragEndProps } = dnd

    const onSliceIndexChange = i => e => {
        const newValue = e.target.value

        const newIndices = [...sliceIndices]
        newIndices[i] = newValue
        setSliceIndices(newIndices)
    }

    const handleScrollWheel = (slice, i) => e => {
        e.preventDefault()

        if (Math.abs(e.deltaY) > 10) {
            const newIndices = [...sliceIndices]
            if (e.deltaY > 0) {
                newIndices[i] = clamp(0, newIndices[i] + 1, headers[slice].length - 1)
                setSliceIndices(newIndices)
            } else {
                newIndices[i] = clamp(0, newIndices[i] - 1, headers[slice].length - 1)
                setSliceIndices(newIndices)
            }
        }
    }

    return (
        <div class="slice-axis">
            {slices.map((slice, i) => (
                <>
                    <div class="axis" {...dragBeginProps(slice)}>
                        {slice}
                    </div>
                    <div class="header">
                        <select
                            value={sliceIndices[i]}
                            onWheel={handleScrollWheel(slice, i)}
                            onChange={onSliceIndexChange(i)}
                        >
                            {headers[slice].map((header, ii) => (
                                <option value={ii}>{header}</option>
                            ))}
                        </select>
                    </div>
                </>
            ))}
            {dragging && <div class="axis drag-preview" {...dragEndProps('slices')}></div>}
        </div>
    )
}

const RowAxisComponent = ({ rows, dnd }) => {
    const { dragging, dragBeginProps, dragEndProps } = dnd

    return (
        <div class="row-axis">
            {rows.map(row => (
                <div class="axis" {...dragBeginProps(row)}>
                    {row}
                </div>
            ))}
            {dragging && <div class="axis drag-preview" {...dragEndProps('rows')}></div>}
        </div>
    )
}
const ColumnAxisComponent = ({ columns, dnd }) => {
    const { dragging, dragBeginProps, dragEndProps } = dnd

    return (
        <div class="column-axis">
            {dragging && <div class="axis drag-preview" {...dragEndProps('columns')}></div>}
            {columns.map(column => (
                <div class="axis" {...dragBeginProps(column)}>
                    {column}
                </div>
            ))}
        </div>
    )
}

const Headers = ({ shape, groupIndices, headers }) => {
    const rec = indices => {
        const [axis, ...rest] = indices

        if (rest.length === 0) {
            return {
                nested: headers[axis].map((header, i) => ({ header, index: i, span: 1, level: 0 })),
                accumulator: shape[axis],
            }
        } else {
            const { nested, accumulator } = rec(rest)

            return {
                nested: [
                    // New Level
                    ...headers[axis].map((header, i) => ({
                        header,
                        index: accumulator * i,
                        span: accumulator,
                        level: 0,
                    })),
                    // Child Levels
                    ...headers[axis].flatMap((_, i) =>
                        nested.map(({ header, index, span, level }) => ({
                            header,
                            index: accumulator * i + index,
                            span,
                            level: level + 1,
                        }))
                    ),
                ],
                accumulator: accumulator * shape[axis],
            }
        }
    }

    const res = rec(groupIndices)

    const topLevel = res.nested[0].level

    return res.nested.map(({ header, index, span, level }) => (
        <div
            class={['header', level === topLevel && 'first'].filter(Boolean).join(' ')}
            style={{ '--index': index + 1, '--span': span, '--level': level + 1 }}
        >
            {header}
        </div>
    ))
}

export const TensorBlock = ({ categories, headers, view, tensor, setBlockValue }) => {
    const { slices, rows, columns } = view

    const [sliceIndices, setSliceIndices] = useState(slices.map(() => 0))

    const dnd = useDragAndDrop((movedAxis, newPlace) => {
        const newView = {
            slices: slices.filter(axis => axis !== movedAxis),
            rows: rows.filter(axis => axis !== movedAxis),
            columns: columns.filter(axis => axis !== movedAxis),
        }

        newView[newPlace].push(movedAxis)

        setSliceIndices(newView.slices.map(() => 0))
        setBlockValue({
            categories,
            headers,
            view: newView,
            tensor,
        })
    })

    const categoryToAxisIndex = invertCategoryMap(categories)

    const indexedHeaders = []
    categories.forEach((cat, i) => {
        indexedHeaders[i] = headers[cat]
    })

    const viewTensor = toTableView(
        tensor,
        {
            slices: slices.map(slice => categoryToAxisIndex[slice]),
            rows: rows.map(row => categoryToAxisIndex[row]),
            columns: columns.map(column => categoryToAxisIndex[column]),
        },
        sliceIndices
    )

    // 2d-array of cells to render
    const cells = Tensors.toArrays(viewTensor)
    const rowCount = viewTensor.shape[0]
    const columnCount = viewTensor.shape[1]

    return (
        <div class="tensor">
            <div class="axis-control slice-and-column">
                <SliceAxisComponent {...{ slices, headers, sliceIndices, setSliceIndices, dnd }} />
                <ColumnAxisComponent {...{ columns, dnd }} />
            </div>
            <div class="grid" style={{ '--rows': rowCount, '--columns': columnCount }}>
                {columns.length > 0 && (
                    <div class="column-headers">
                        <Headers
                            groupIndices={columns.map(col => categoryToAxisIndex[col])}
                            headers={indexedHeaders}
                            shape={tensor.shape}
                        />
                    </div>
                )}
                {rows.length > 0 && (
                    <div class="row-headers">
                        <Headers
                            groupIndices={rows.map(row => categoryToAxisIndex[row])}
                            headers={indexedHeaders}
                            shape={tensor.shape}
                        />
                    </div>
                )}
                <div class="data">
                    {cells.map(row => row.map(cell => <div class="cell">{cell}</div>))}
                </div>
            </div>
            <div class="axis-control row">
                <RowAxisComponent {...{ rows, dnd }} />
            </div>
        </div>
    )
}
