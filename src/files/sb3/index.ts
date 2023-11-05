import JSZip from "jszip";
import {Entity, Sprite, Stage} from "../../entities";
import type {Project, Target, Block, Input} from "./types";

export function isProjectCompatible(project: Project) {
    if (project.extensions.length > 0 && project.extensions[0] !== "pen") {
        throw "Scrap does not support extensions other than the pen extension.";
    }
}

export function isTargetCompatible(target: Target) {
    if (Object.keys(target.lists).length) {
        throw "Scrap does not support lists.";
    }
}

export function transformInput(target: Target, [shadow, data]: Input, entity: Entity) {
    if (typeof data === "string") {
        const block = transformBlock(target, target.blocks[data], entity);
        block.setShadow(shadow === 1);
        return block;
    }
    switch (data[0]) {
        case 4:
        case 5:
        case 6:
        case 7:
        case 8: {
            const block = entity.codeWorkspace.newBlock("math_number");
            block.setFieldValue(+data[1], "NUM");
            block.setShadow(true);
            return block;
        }
        case 9: {
            const block = entity.codeWorkspace.newBlock("color");
            block.setFieldValue(data[1], "COLOR");
            block.setShadow(true);
            return block;
        }
        case 10:
        case 11: {
            const block = entity.codeWorkspace.newBlock("iterables_string");
            block.setFieldValue(data[1], "TEXT");
            block.setShadow(true);
            return block;
        }
        case 12: {
            const block = entity.codeWorkspace.newBlock("getVariable");
            block.setFieldValue(data[2], "VAR");
            block.setShadow(true);
            return block;
        }
    }
    throw "Unknown input type: " + data[0];
}

export function transformBlock(target: Target, data: Block, entity: Entity) {
    if (data.opcode in transformers) {
        return transformers[data.opcode](target, data, entity);
    }
    throw "Unknown block type: " + data.opcode;
}

function transformCommon(target: Target, data: Block, entity: Entity, override: {
    opcode?: string;
    inputs?: Record<string, string>;
}) {
    const block = entity.codeWorkspace.newBlock(override.opcode ?? data.opcode);
    for (const [name, input] of Object.entries(data.inputs)) {
        block.getInput(override.inputs?.[name] ?? name)!.connection!.connect(
            transformInput(
                target,
                input,
                entity
            ).outputConnection!
        );
    }
    if (data.next) {
        block.nextConnection!.connect(
            transformBlock(
                target,
                target.blocks[data.next],
                entity
            ).previousConnection!
        );
    }
    return block;
}

const transformers: Record<string, (target: Target, data: Block, entity: Entity) => import("blockly").Block> = {
    motion_movesteps(target, data, entity) {
        return transformCommon(target, data, entity, {
            opcode: "move"
        });
    },
    motion_turnright(target, data, entity) {
        return transformCommon(target, data, entity, {
            opcode: "turnRight"
        });
    },
    motion_turnleft(target, data, entity) {
        return transformCommon(target, data, entity, {
            opcode: "turnLeft"
        });
    },
    motion_pointindirection(target, data, entity) {
        return transformCommon(target, data, entity, {
            opcode: "pointInDirection"
        });
    },
    motion_gotoxy(target, data, entity) {
        return transformCommon(target, data, entity, {
            opcode: "goTo"
        });
    },
    motion_glidesecstoxy(target, data, entity) {
        return transformCommon(target, data, entity, {
            opcode: "glide"
        });
    },
    motion_changexby(target, data, entity) {
        return transformCommon(target, data, entity, {
            opcode: "changeX",
            inputs: {DX: "X"}
        });
    },
    motion_setx(target, data, entity) {
        return transformCommon(target, data, entity, {
            opcode: "setX",
        });
    },
    motion_changeyby(target, data, entity) {
        return transformCommon(target, data, entity, {
            opcode: "changeY",
            inputs: {DY: "Y"}
        });
    },
    motion_sety(target, data, entity) {
        return transformCommon(target, data, entity, {
            opcode: "setY",
        });
    },
    
};

export function transformTarget(target: Target, entity: Entity) {
    entity.codeWorkspace.clear();
    for (const block of Object.values(target.blocks)) {
        if (block.topLevel) {
            transformBlock(target, block, entity);
        }
    }
}

export async function transformProject(file: File) {
    const zip = await JSZip.loadAsync(file);
    const project: Project = JSON.parse(
        await zip.file("project.json")!.async("text")
    );
    isProjectCompatible(project);
    const entities: Entity[] = [];
    for (const target of project.targets) {
        isTargetCompatible(target);
        const entity = target.isStage
            ? new Stage()
            : new Sprite(target.name)
            ;
        entity.costumes = [];
        for (const costume of target.costumes) {
            const filename = `${costume.assetId}.${costume.dataFormat}`;
            entity.costumes.push(
                new File(
                    [await zip.file(filename)!.async("blob")],
                    `${costume.name}.${costume.dataFormat}`,
                    {type: `image/${costume.dataFormat}${costume.dataFormat === "svg" ? "+xml" : ""}`}
                )
            );
        }
        transformTarget(target, entity);
        entities.push(entity);
    }
    return entities;
}