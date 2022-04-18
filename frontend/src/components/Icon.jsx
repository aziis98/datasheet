const iconMap = {
    dimension: { src: '/icons/Dimension.svg', alt: 'dimension' },
    axis: { src: '/icons/Axis.svg', alt: 'axis' },
}

export const Icon = ({ name }) => <img class="icon" {...iconMap[name]} />
