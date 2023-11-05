import JSZip from "jszip";
import {Entity, Sprite, Stage} from "../../entities";
import type {Project, Target, Block, Input} from "./types";
import type App from "../../app";

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

interface Override {
    opcode?: string;
    inputs?: Record<string, string>;
}

function transform(override: Override, target: Target, data: Block, entity: Entity) {
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
    return nextBlock(block, target, data, entity);
}

function nextBlock(block: import("blockly").Block, target: Target, data: Block, entity: Entity) {
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

function effect(data: Block, entity: Entity) {
    const block = entity.codeWorkspace.newBlock("effect");

    switch (data.fields.EFFECT[0]) {
        case "COLOR":
            block.setFieldValue("color", "EFFECT");
            break;
        case "GHOST":
            block.setFieldValue("ghost", "EFFECT");
            break;
        case "BRIGHTNESS":
            block.setFieldValue("brightness", "EFFECT");
            break;
    }

    block.setShadow(true);

    return block.outputConnection!;
}

const transformers: Record<string, (target: Target, data: Block, entity: Entity) => import("blockly").Block> = {
    // Motion
    motion_movesteps: transform.bind(null, {
        opcode: "move"
    }),
    motion_turnright: transform.bind(null, {
        opcode: "turnRight"
    }),
    motion_turnleft: transform.bind(null, {
        opcode: "turnLeft"
    }),
    motion_pointindirection: transform.bind(null, {
        opcode: "pointInDirection"
    }),
    motion_gotoxy: transform.bind(null, {
        opcode: "goTo"
    }),
    motion_glidesecstoxy: transform.bind(null, {
        opcode: "glide"
    }),
    motion_changexby: transform.bind(null, {
        opcode: "changeX",
        inputs: {DX: "X"}
    }),
    motion_setx: transform.bind(null, {
        opcode: "setX",
        inputs: {X: "X"}
    }),
    motion_changeyby: transform.bind(null, {
        opcode: "changeY",
        inputs: {DY: "Y"}
    }),
    motion_sety: transform.bind(null, {
        opcode: "setY",
        inputs: {Y: "Y"}
    }),
    motion_ifonedgebounce: transform.bind(null, {
        opcode: "ifOnEdgeBounce"
    }),
    motion_setrotationstyle: transform.bind(null, {
        opcode: "setRotationStyle"
    }),
    motion_xposition: ({}, {}, {codeWorkspace}) => codeWorkspace.newBlock("x"),
    motion_yposition: ({}, {}, {codeWorkspace}) => codeWorkspace.newBlock("y"),
    motion_direction: ({}, {}, {codeWorkspace}) => codeWorkspace.newBlock("direction"),
   
    // Looks
    looks_sayforsecs: transform.bind(null, {
        opcode: "sayWait"
    }),
    looks_say: transform.bind(null, {
        opcode: "say"
    }),
    looks_thinkforsecs: transform.bind(null, {
        opcode: "thinkWait"
    }),
    looks_think: transform.bind(null, {
        opcode: "think"
    }),
    looks_show: transform.bind(null, {
        opcode: "show"
    }),
    looks_hide: transform.bind(null, {
        opcode: "hide"
    }),
    looks_changeeffectby(target, data, entity) {
        const block = entity.codeWorkspace.newBlock("changeEffect");
        block.getInput("EFFECT")!.connection!.connect(effect(data, entity));
        block.getInput("CHANGE")!.connection!.connect(
            transformInput(target, data.inputs.CHANGE, entity).outputConnection!
        );
        return nextBlock(block, target, data, entity);
    },
    looks_seteffectto(target, data, entity) {
        const block = entity.codeWorkspace.newBlock("setEffect");
        block.getInput("EFFECT")!.connection!.connect(effect(data, entity));
        block.getInput("CHANGE")!.connection!.connect(
            transformInput(target, data.inputs.VALUE, entity).outputConnection!
        );
        return nextBlock(block, target, data, entity);
    },
    looks_cleargraphiceffects: transform.bind(null, {
        opcode: "clearEffects"
    }),
    looks_changesizeby: transform.bind(null, {
        opcode: "changeSize",
        inputs: {CHANGE: "SIZE"}
    }),
    looks_setsizeto: transform.bind(null, {
        opcode: "setSize"
    }),
    looks_size: ({}, {}, {codeWorkspace}) => codeWorkspace.newBlock("size"),
    looks_costume: ({}, {fields}, {codeWorkspace}) => {
        const block = codeWorkspace.newBlock("costume_menu");
        block.setFieldValue(fields.COSTUME[0], "NAME");
        return block;
    },
    looks_switchcostumeto: transform.bind(null, {
        opcode: "switchCostume"
    }),
    looks_nextcostume: transform.bind(null, {
        opcode: "nextCostume"
    }),
    looks_switchbackdropto: transform.bind(null, {
        opcode: "switchBackdrop",
        inputs: {BACKDROP: "COSTUME"}
    }),
    looks_gotofrontback: (target, data, entity) => {
        const block = data.fields.FRONT_BACK[0] === "front"
            ? entity.codeWorkspace.newBlock("goToFront")
            : entity.codeWorkspace.newBlock("goToBack")
        ;
        return nextBlock(block, target, data, entity);
    },
    looks_goforwardbackwardlayers: (target, data, entity) => {
        const block = data.fields.FORWARD_BACKWARD[0] === "forward"
            ? entity.codeWorkspace.newBlock("goForward")
            : entity.codeWorkspace.newBlock("goBackward")
        ;
        block.setFieldValue(data.fields.NUM[0], "NUM");
        return nextBlock(block, target, data, entity);
    },
    looks_backdropnumbername: ({}, {fields}, {codeWorkspace}) => codeWorkspace.newBlock(
        fields.NUMBER_NAME[0] === "number"
            ? "backdropNumber"
            : "backdrop"
    ),
    looks_costumenumbername: ({}, {fields}, {codeWorkspace}) => codeWorkspace.newBlock(
        fields.NUMBER_NAME[0] === "number"
            ? "costumeNumber"
            : "costume"
    ),
    looks_nextbackdrop: transform.bind(null, {
        opcode: "nextBackdrop"
    }),
    sound_sounds_menu: ({}, {fields}, {codeWorkspace}) => {
        const block = codeWorkspace.newBlock("sound");
        block.setFieldValue(fields.SOUND_MENU[0], "NAME");
        return block;
    },
    sound_play: transform.bind(null, {
        opcode: "playSound",
        inputs: {SOUND_MENU: "SOUND"}
    }),
    sound_playuntildone: transform.bind(null, {
        opcode: "playSoundUntilDone",
        inputs: {SOUND_MENU: "SOUND"}
    }),
    sound_stopallsounds: transform.bind(null, {
        opcode: "stopSounds"
    }),
    sound_setvolumeto: transform.bind(null, {
        opcode: "setVolume"
    }),
    sound_changevolumeby: transform.bind(null, {
        opcode: "changeVolume",
        inputs: {VOLUME: "VALUE"}
    }),
    sound_volume: ({}, {}, {codeWorkspace}) => codeWorkspace.newBlock("volume"),

    // Pen
    pen_clear: transform.bind(null, {
        opcode: "penClear"
    }),
    pen_stamp: transform.bind(null, {
        opcode: "stamp"
    }),
    pen_penDown: transform.bind(null, {
        opcode: "penDown"
    }),
    pen_penUp: transform.bind(null, {
        opcode: "penUp"
    }),
    pen_setPenColorToColor: transform.bind(null, {
        opcode: "setPenColor"
    }),
    pen_changePenSizeBy: transform.bind(null, {
        opcode: "changePenSize",
    }),
    pen_setPenSizeTo: transform.bind(null, {
        opcode: "setPenSize"
    }),
    
    // Events
    event_whenflagclicked: transform.bind(null, {
        opcode: "whenFlag"
    }),
    event_whenthisspriteclicked: (target, data, entity) => {
        const block = entity.codeWorkspace.newBlock("whenMouse");
        block.getInput("MOUSE")!.connection!.connect(
            entity.codeWorkspace.newBlock("event")!.outputConnection!
        );
        return nextBlock(block, target, data, entity);
    },
    event_whenbroadcastreceived: (target, data, entity) => {
        const block = entity.codeWorkspace.newBlock("whenReceiveMessage");
        const message = entity.codeWorkspace.newBlock("iterables_string");
        message.setFieldValue(data.fields.BROADCAST_OPTION[0], "TEXT");
        message.setShadow(true);
        block.getInput("MESSAGE")!.connection!.connect(message.outputConnection!);
        return nextBlock(block, target, data, entity);
    },
    event_broadcast: transform.bind(null, {
        opcode: "broadcastMessage",
        inputs: {BROADCAST_INPUT: "MESSAGE"}
    }),
    event_broadcastandwait: transform.bind(null, {
        opcode: "broadcastMessageWait",
        inputs: {BROADCAST_INPUT: "MESSAGE"}
    }),
    event_whenkeypressed: (target, data, entity) => {
        const block = entity.codeWorkspace.newBlock("whenKeyPressed");
        return nextBlock(block, target, data, entity);
    }
};

transformers.looks_backdrops = transformers.looks_costume;
transformers.event_whenstageclicked = transformers.event_whenthisspriteclicked;

export function transformTarget(target: Target, entity: Entity) {
    entity.codeWorkspace.clear();
    for (const block of Object.values(target.blocks)) {
        if (block.topLevel) {
            transformBlock(target, block, entity);
        }
    }
}

export async function transformProject(app: App, file: File) {
    const zip = await JSZip.loadAsync(file);
    const project: Project = JSON.parse(
        await zip.file("project.json")!.async("text")
    );
    isProjectCompatible(project);
    for (const target of project.targets) {
        isTargetCompatible(target);
        const entity = target.isStage
            ? new Stage()
            : new Sprite(target.name)
            ;
        app.current = entity;
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
        entity.update();
        entity.sounds = [];
        for (const sound of target.sounds) {
            const filename = `${sound.assetId}.${sound.dataFormat}`;
            entity.sounds.push(
                new File(
                    [await zip.file(filename)!.async("blob")],
                    `${sound.name}.${sound.dataFormat}`,
                    {type: `audio/${sound.dataFormat}`}
                )
            );
        }
        transformTarget(target, entity);
        
        if (target.isStage) {
            app.entities.unshift(entity);
            entity.render(app.stagePanel);
        } else {
            app.addSprite(entity as Sprite)
        }
    }
}