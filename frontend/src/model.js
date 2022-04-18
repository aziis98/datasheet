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

                            Lorem ipsum dolor _sit_ amet *consectetur* adipisicing elit. Facilis aliquid excepturi maxime ~consequuntur~ cum dolore a saepe, perspiciatis accusamus voluptas suscipit amet impedit, laudantium distinctio, quibusdam repellendus?
                            
                            Eaque, vitae! Vero natus cum maxime dolorem ipsam, deserunt ipsum reprehenderit odit! Possimus ipsa itaque numquam illo rerum totam officiis vel aut facilis.
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
                    type: 'markdown',
                    value: {
                        source: dedent(`
                            Odit repudiandae aliquam ex quas at nobis earum facilis corporis fuga numquam dignissimos, laudantium placeat asperiores, atque vitae aperiam non maiores perferendis rerum in. 
                            
                            Similique odio officiis eos porro ducimus aut libero nulla, ullam tenetur nam? Est neque error dolorum fuga, necessitatibus, temporibus similique laboriosam veritatis natus labore nisi obcaecati.
                        `),
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
                {
                    type: 'markdown',
                    value: {
                        source: dedent(`
                            Similique odio officiis eos porro ducimus aut libero nulla, ullam tenetur nam? Est neque error dolorum fuga, necessitatibus, temporibus similique laboriosam veritatis natus labore nisi obcaecati.
                        `),
                    },
                },
            ],
        },
    },
}

export function currentProject({ currentProject, projects }) {
    return projects[currentProject]
}
