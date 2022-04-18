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
                        categories: ['Years', 'Months', 'Zones'],
                        headers: {
                            ['Years']: Arrays.range(2018, 2022).map(n => '' + n),
                            ['Months']: 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(
                                ' '
                            ),
                            ['Zones']: 'Zone 1,Zone 2,Zone 3'.split(','),
                        },
                        view: {
                            slices: ['Years'],
                            rows: ['Zones'],
                            columns: ['Months'],
                        },
                        tensor: ndarray(Arrays.range(1, 180), [5, 12, 3]),
                    },
                },
                {
                    type: 'tensor',
                    value: {
                        categories: ['X', 'Y', 'Z'],
                        headers: {
                            ['X']: Arrays.range(1, 2),
                            ['Y']: Arrays.range(1, 3),
                            ['Z']: Arrays.range(1, 5),
                        },
                        view: {
                            slices: ['X'],
                            rows: ['Y'],
                            columns: ['Z'],
                        },
                        tensor: ndarray(Arrays.range(1, 30), [2, 3, 5]),
                    },
                },
            ],
        },
    },
}

export function currentProject({ currentProject, projects }) {
    return projects[currentProject]
}
