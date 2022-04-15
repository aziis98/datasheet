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
                        data: Array.from({ length: 12 }).map((_, i) => i + 1),
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
