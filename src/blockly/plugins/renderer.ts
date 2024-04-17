import * as Blockly from "blockly";

export class Renderer extends Blockly.zelos.Renderer {
    protected override makeConstants_() {
        return new class extends Blockly.zelos.ConstantProvider {
            shapeFor(connection: Blockly.RenderedConnection) {
                const check = connection.getCheck();

                if (check?.some(a => a === "boolean" || a === "type")) {
                    return this.HEXAGONAL!;
                }

                return super.shapeFor(connection);
            }
        };
    }

    protected makeDrawer_(block: Blockly.BlockSvg, info: Blockly.blockRendering.RenderInfo) {
        return new class extends Blockly.zelos.Drawer {
            constructor() {
                super(block, info as Blockly.zelos.RenderInfo);
            }

            protected layoutField_(fieldInfo: Blockly.blockRendering.Icon | Blockly.blockRendering.Field): void {
                const yPos = fieldInfo.centerline - fieldInfo.height / 2;
                let xPos = fieldInfo.xPos;
                let scale = '';
                if (this.info_.RTL) {
                    xPos = -(xPos + fieldInfo.width);
                    if (fieldInfo.flipRtl) {
                        xPos += fieldInfo.width;
                        scale = 'scale(-1 1)';
                    }
                }

                if (Blockly.blockRendering.Types.isIcon(fieldInfo)) {
                    const icon = (fieldInfo as Blockly.blockRendering.Icon).icon;
                    icon.setOffsetInBlock(new Blockly.utils.Coordinate(xPos, yPos));
                    if (this.info_.isInsertionMarker) {
                        icon.hideForInsertionMarker();
                    }
                } else {
                    const svgGroup = (fieldInfo as Blockly.blockRendering.Field).field.getSvgRoot();
                    if (!svgGroup) {
                        return;
                    }
                    svgGroup.setAttribute(
                        'transform',
                        'translate(' + xPos + ',' + yPos + ')' + scale,
                    );
                    if (this.info_.isInsertionMarker) {
                        svgGroup.setAttribute('display', 'none');
                    }
                }
            }
        };
    }
}