import { MarkdownBlock } from './blocks/Markdown.jsx'
import { TensorBlock } from './blocks/Tensor.jsx'

const blockComponentMap = {
    markdown: MarkdownBlock,
    tensor: TensorBlock,
}

export const Block = ({ type, value }) => (
    <div class={['block', type].join(' ')}>{blockComponentMap[type]({ ...value })}</div>
)
