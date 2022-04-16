import ndarray from 'ndarray'
import { Arrays, Tensors } from './tensors.js'
import { dedent } from './util.js'

export const EXAMPLE_STATE_1 = {
    currentProject: '80527d0a-bcc3-11ec-bc2c-7f4cfddd685e',
    currentMode: 'outline',
    projects: {
        '80527d0a-bcc3-11ec-bc2c-7f4cfddd685e': {
            title: 'Untitled',
            blocks: [
                {
                    type: 'markdown',
                    value: {
                        source: dedent(`
                            # Example

                            Lorem ipsum
                        `),
                    },
                },
                {
                    type: 'tensor',
                    value: {
                        categories: ['Years', 'Months', 'Places'],
                        headers: {
                            Years: Arrays.range(2018, 2022),
                            Months: 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' '),
                            Places: 'House 1,House 2,House 3'.split(','),
                        },
                        view: {
                            slices: ['Places'],
                            rows: ['Years'],
                            columns: ['Months'],
                        },
                        tensor: ndarray(Arrays.range(1, 180), [5, 12, 3]),
                    },
                },
            ],
        },
    },
}

console.log(EXAMPLE_STATE_1.projects['80527d0a-bcc3-11ec-bc2c-7f4cfddd685e'].blocks[0].value)

export function currentProject({ currentProject, projects }) {
    return projects[currentProject]
}
