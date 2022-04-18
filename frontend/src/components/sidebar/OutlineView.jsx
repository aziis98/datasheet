import { Icon } from '../Icon.jsx'

// Outline shows an outline of the current project, this shows all the various "tensors" present in the current view with what axis are currently shown
export const OutlineView = ({ project }) => {
    return (
        <div class="outline">
            <div class="node">
                <div class="label">
                    <i class="gg-file-document"></i>
                    <div class="text">Untitled</div>
                </div>
                <div class="children">
                    <div class="node">
                        <div class="label">
                            <i class="gg-list-tree"></i>
                            <div class="text">Example 1</div>
                        </div>
                        <div class="children">
                            <div class="node">
                                <div class="label">
                                    <Icon name="dimension" />
                                    <div class="text">Slices</div>
                                </div>
                                <div class="children">
                                    <div class="node axis">
                                        <div class="label">
                                            <Icon name="axis" />
                                            <div class="text">(Empty)</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="node">
                                <div class="label">
                                    <Icon name="dimension" />
                                    <div class="text">Rows</div>
                                </div>
                                <div class="children">
                                    <div class="node axis">
                                        <div class="label">
                                            <Icon name="axis" />
                                            <div class="text">Months</div>
                                        </div>
                                    </div>
                                    <div class="node axis">
                                        <div class="label">
                                            <Icon name="axis" />
                                            <div class="text">Day</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="node">
                                <div class="label">
                                    <Icon name="dimension" />
                                    <div class="text">Columns</div>
                                </div>
                                <div class="children">
                                    <div class="node axis">
                                        <div class="label">
                                            <Icon name="axis" />
                                            <div class="text">Years</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="node">
                        <div class="label">
                            <i class="gg-details-more"></i>
                            <div class="text">Markdown</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
