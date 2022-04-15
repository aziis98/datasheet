const classNames = (...classes) => classes.filter(Boolean).join(' ')

const Text = ({ value }) => <div class="value text">{value}</div>

const Numeric = {
    Integer: ({ value }) => <div class="value integer">{value | 0}</div>,
    Rational: ({ value: { num, den } }) => (
        <div class="value rational">
            <div class="numerator">{num | 0}</div>
            <div class="denominator">{den | 0}</div>
        </div>
    ),
    Decimal: ({ value }) => <div class="value decimal">{value}</div>,
}

const Label = ({ value }) => <div class="value label">{value}</div>

const Row = ({ value }) => (
    <div class="value row">
        {value.map(item => (
            <div class="item">
                <Value {...item} />
            </div>
        ))}
    </div>
)

const Column = ({ value }) => (
    <div class="value column">
        {value.map(item => (
            <div class="item">
                <Value {...item} />
            </div>
        ))}
    </div>
)

const Grid = ({ value }) => {
    const rowCount = value.length
    const columnCount = value[0].length

    return (
        <div class="value grid" style={{ '--rows': rowCount, '--columns': columnCount }}>
            {value.map((row, i) =>
                row.map((cell, j) => (
                    <div
                        class={classNames(
                            'cell',
                            i + 1 === rowCount && 'last-row',
                            j + 1 === columnCount && 'last-column'
                        )}
                        style={{ '--row': i, '--column': j }}
                    >
                        <Value {...cell} />
                    </div>
                ))
            )}
        </div>
    )
}

const typeMap = {
    // Text-like
    text: Text,

    // Number-like
    integer: Numeric.Integer,
    rational: Numeric.Rational,
    decimal: Numeric.Decimal,

    // Special
    label: Label, // a special element used as a label or header and reference-able
    // reference: Reference, // reference the value of another cell in the sheet
    // import: Import, // like Reference but imports values from other sheets
    // formula: Formula, // dynamically evaluate something based on other values in the current sheet

    // Structured
    row: Row,
    column: Column,
    grid: Grid,
}

export const Value = props => {
    const DynamicComponent = typeMap[props.type]
    return DynamicComponent ? <DynamicComponent {...props} /> : <div class="error">Error</div>
}
