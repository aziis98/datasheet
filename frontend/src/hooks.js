import { useRef, useState } from 'preact/hooks'

export const withItemAt = (list, index) => newValue => {
    const newList = [...list]
    newList[index] = newValue
    return newList
}

export const useDragAndDrop = handleMove => {
    const [dragging, setDragging] = useState(false)

    const dndElement = useRef()
    const dndSourceValue = useRef()
    const dndTargetPlace = useRef()

    const handleDragStart = (e, value) => {
        console.log('handleDragStart')
        console.log(e, value)

        dndSourceValue.current = value
        dndElement.current = e.target
        dndElement.current.addEventListener('dragend', handleDragEnd)

        setTimeout(() => setDragging(true), 1)
    }

    const handleDragEnd = e => {
        console.log('handleDragEnd')
        console.log(e.target)

        const sourceValue = dndSourceValue.current
        const targetValue = dndTargetPlace.current

        if (targetValue) {
            handleMove(sourceValue, targetValue)
        }

        // cleanup

        dndElement.current.removeEventListener('dragend', handleDragEnd)

        dndElement.current = null
        dndSourceValue.current = null
        dndTargetPlace.current = null

        setDragging(false)
    }

    return {
        dragging,
        dragBeginProps(value) {
            return {
                draggable: true,
                onDragStart: e => {
                    console.log('onDragStart')
                    console.log(value)

                    handleDragStart(e, value)
                },
            }
        },
        dragEndProps(value) {
            return {
                onDragEnter: e => {
                    console.log('onDragEnter')

                    dndTargetPlace.current = value
                },
                onDragLeave: e => {
                    console.log('onDragLeave')
                },
            }
        },
    }
}
