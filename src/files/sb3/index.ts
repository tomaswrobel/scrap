import JSZip from "jszip";
import {Entity, Sprite, Stage} from "../../entities";
import type {Project, Target, Block, Input} from "./types";
import type App from "../../app";
import type * as Blockly from "blockly";

class SB3 {
    target!: Target;
    entity!: Entity;

    transformers: Record<string, (data: Block) => Blockly.Block> = {};

    constructor(private app: App) {
        this.transformers.motion_movesteps = this.override({opcode: "move"});
        this.transformers.motion_turnright = this.override({
            opcode: "turnRight"
        });
        this.transformers.motion_turnleft = this.override({
            opcode: "turnLeft"
        });
        this.transformers.motion_pointindirection = this.override({
            opcode: "pointInDirection"
        });
        this.transformers.motion_gotoxy = this.override({
            opcode: "goTo"
        });
        this.transformers.motion_glidesecstoxy = this.override({
            opcode: "glide"
        });
        this.transformers.motion_changexby = this.override({
            opcode: "changeX",
            inputs: {DX: "X"}
        });
        this.transformers.motion_setx = this.override({
            opcode: "setX",
            inputs: {X: "X"}
        });
        this.transformers.motion_changeyby = this.override({
            opcode: "changeY",
            inputs: {DY: "Y"}
        });
        this.transformers.motion_sety = this.override({
            opcode: "setY",
            inputs: {Y: "Y"}
        });
        this.transformers.motion_ifonedgebounce = this.override({
            opcode: "ifOnEdgeBounce"
        });
        this.transformers.motion_setrotationstyle = this.override({
            opcode: "setRotationStyle"
        });

        this.transformers.motion_xposition = this.reporter("x");
        this.transformers.motion_yposition = this.reporter("y");
        this.transformers.motion_direction = this.reporter("direction");

        // Looks
        this.transformers.looks_sayforsecs = this.override({
            opcode: "sayWait"
        });
        this.transformers.looks_say = this.override({
            opcode: "say"
        });
        this.transformers.looks_thinkforsecs = this.override({
            opcode: "thinkWait"
        });
        this.transformers.looks_think = this.override({
            opcode: "think"
        });
        this.transformers.looks_show = this.override({
            opcode: "show"
        });
        this.transformers.looks_hide = this.override({
            opcode: "hide"
        });
        this.transformers.looks_changeeffectby = data => {
            const block = this.entity.codeWorkspace.newBlock("changeEffect");
            block.getInput("EFFECT")!.connection!.connect(this.effect(data));
            block.getInput("CHANGE")!.connection!.connect(
                this.input(data.inputs.CHANGE)!.outputConnection!
            );
            return this.next(block, data);
        };
        this.transformers.looks_seteffectto = data => {
            const block = this.entity.codeWorkspace.newBlock("setEffect");
            block.getInput("EFFECT")!.connection!.connect(this.effect(data));
            block.getInput("CHANGE")!.connection!.connect(
                this.input(data.inputs.VALUE)!.outputConnection!
            );
            return this.next(block, data);
        };
        this.transformers.looks_cleargraphiceffects = this.override({
            opcode: "clearEffects"
        });
        this.transformers.looks_changesizeby = this.override({
            opcode: "changeSize",
            inputs: {CHANGE: "SIZE"}
        });
        this.transformers.looks_setsizeto = this.override({
            opcode: "setSize",
        });
        this.transformers.looks_size = this.reporter("size");
        this.transformers.looks_costume = this.transformers.looks_backdrop = data => {
            const block = this.entity.codeWorkspace.newBlock("costume_menu");
            block.setFieldValue(data.fields.COSTUME[0], "NAME");
            return block;
        };
        this.transformers.looks_switchcostumeto = this.override({
            opcode: "switchCostume",
        });
        this.transformers.looks_nextcostume = this.override({
            opcode: "nextCostume",
        });
        this.transformers.looks_switchbackdropto = this.override({
            opcode: "switchBackdrop",
        });
        this.transformers.looks_gotofrontback = data => {
            const block = data.fields.FRONT_BACK[0] === "front"
                ? this.entity.codeWorkspace.newBlock("goToFront")
                : this.entity.codeWorkspace.newBlock("goToBack")
                ;
            return this.next(block, data);
        };
        this.transformers.looks_goforwardbackwardlayers = this.override({
            opcode: "goLayers",
        });
        this.transformers.looks_costumenumbername = data => (
            data.fields.NUMBER_NAME[0] === "number"
                ? this.entity.codeWorkspace.newBlock("costumeNumber")
                : this.entity.codeWorkspace.newBlock("costumeName")
        );
        this.transformers.looks_backdropnumbername = data => (
            data.fields.NUMBER_NAME[0] === "number"
                ? this.entity.codeWorkspace.newBlock("backdropNumber")
                : this.entity.codeWorkspace.newBlock("backdropName")
        );
        this.transformers.looks_nextbackdrop = this.override({
            opcode: "nextBackdrop",
        });

        // Sounds
        this.transformers.sound_sounds_menu = data => {
            const block = this.entity.codeWorkspace.newBlock("sound");
            const name = data.fields.SOUND_MENU[0];
            const file = this.target.sounds.find(sound => sound.name === name)!;
            block.setFieldValue(`${name}.${file!.dataFormat}`, "NAME");
            return block;
        };
        this.transformers.sound_play = this.override({
            opcode: "playSound",
            inputs: {SOUND_MENU: "SOUND"}
        });
        this.transformers.sound_playuntildone = this.override({
            opcode: "playSoundUntilDone",
            inputs: {SOUND_MENU: "SOUND"}
        });
        this.transformers.sound_stopallsounds = this.override({
            opcode: "stopSounds"
        });
        this.transformers.sound_setvolumeto = this.override({
            opcode: "setVolume"
        });
        this.transformers.sound_changevolumeby = this.override({
            opcode: "changeVolume",
            inputs: {VOLUME: "VALUE"}
        });
        this.transformers.sound_volume = this.reporter("volume"),

            // Pen
            this.transformers.pen_clear = this.override({
                opcode: "penClear"
            });
        this.transformers.pen_stamp = this.override({
            opcode: "stamp"
        });
        this.transformers.pen_penDown = this.override({
            opcode: "penDown"
        });
        this.transformers.pen_penUp = this.override({
            opcode: "penUp"
        });
        this.transformers.pen_setPenColorToColor = this.override({
            opcode: "setPenColor"
        });
        this.transformers.pen_changePenSizeBy = this.override({
            opcode: "changePenSize",
        });
        this.transformers.pen_setPenSizeTo = this.override({
            opcode: "setPenSize"
        });

        // Events
        this.transformers.event_whenflagclicked = this.override({
            opcode: "whenFlag"
        });
        this.transformers.event_whenthisspriteclicked = data => {
            const block = this.entity.codeWorkspace.newBlock("whenMouse");
            block.getInput("MOUSE")!.connection!.connect(
                this.entity.codeWorkspace.newBlock("event")!.outputConnection!
            );
            return this.next(block, data);
        };
        this.transformers.event_whenstageclicked = this.transformers.event_whenthisspriteclicked;
        this.transformers.event_whenbroadcastreceived = data => {
            const block = this.entity.codeWorkspace.newBlock("whenReceiveMessage");
            const message = this.entity.codeWorkspace.newBlock("iterables_string");
            message.setFieldValue(data.fields.BROADCAST_OPTION[0], "TEXT");
            message.setShadow(true);
            block.getInput("MESSAGE")!.connection!.connect(message.outputConnection!);
            return this.next(block, data);
        };
        this.transformers.event_broadcast = this.override({
            opcode: "broadcastMessage",
            inputs: {BROADCAST_INPUT: "MESSAGE"}
        });
        this.transformers.event_broadcastandwait = this.override({
            opcode: "broadcastMessageWait",
            inputs: {BROADCAST_INPUT: "MESSAGE"}
        });

        // Control
        this.transformers.control_wait = this.override({
            opcode: "wait",
            inputs: {DURATION: "SECS"}
        });
        this.transformers.control_repeat_until = data => {
            const block = this.entity.codeWorkspace.newBlock("while");
            const not = this.entity.codeWorkspace.newBlock("not");

            const condition = this.input(data.inputs.CONDITION);
            if (condition) {
                not.getInput("BOOL")!.connection!.connect(condition.outputConnection!);
            }

            block.getInput("CONDITION")!.connection!.connect(not.outputConnection!);

            if ("SUBSTACK" in data.inputs) {
                block.getInput("STACK")!.connection!.connect(
                    this.input(data.inputs.SUBSTACK)!.previousConnection!
                );
            }

            return this.next(block, data);
        };
        this.transformers.control_wait_until = this.transformers.control_repeat_until;
        this.transformers.control_repeat = this.override({
            opcode: "repeat",
            inputs: {SUBSTACK: "STACK"}
        });
        this.transformers.control_start_as_clone = this.override({
            opcode: "whenCloned"
        });
        this.transformers.control_forever = data => {
            const block = this.entity.codeWorkspace.newBlock("while");
        
            if ("SUBSTACK" in data.inputs) {
                block.getInput("STACK")!.connection!.connect(
                    this.input(data.inputs.SUBSTACK)!.previousConnection!
                );
            }

            const trueBlock = this.entity.codeWorkspace.newBlock("boolean");
            trueBlock.setFieldValue("true", "BOOL");

            block.getInput("CONDITION")!.connection!.connect(trueBlock.outputConnection!);

            return block;
        };
        this.transformers.control_if = this.override({
            inputs: {
                SUBSTACK: "DO0",
                CONDITION: "IF0"
            },
            opcode: "controls_if"
        });
        this.transformers.control_if_else = this.override({
            inputs: {
                SUBSTACK: "DO0",
                SUBSTACK2: "ELSE",
                CONDITION: "IF0"
            },
            opcode: "controls_if",
            extraState: {
                hasElse: true
            }
        });
        this.transformers.sensing_touchingcolor = this.override({
            opcode: "isTouchingBackdropColor",
        });
    }

    effect(data: Block) {
        const block = this.entity.codeWorkspace.newBlock("effect");

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

    async transform(file: File) {
        const zip = await JSZip.loadAsync(file);
        const project: Project = JSON.parse(await zip.file("project.json")!.async("text"));
        this.isProjectCompatible(project);

        for (const target of project.targets) {
            this.isTargetCompatible(target);
            this.app.current = this.entity = target.isStage
                ? new Stage()
                : new Sprite(target.name);
            this.target = target;
            this.entity.costumes = [];
            for (const costume of target.costumes) {
                const filename = `${costume.assetId}.${costume.dataFormat}`;
                this.entity.costumes.push(
                    new File(
                        [await zip.file(filename)!.async("blob")],
                        `${costume.name}.${costume.dataFormat}`,
                        {type: `image/${costume.dataFormat}${costume.dataFormat === "svg" ? "+xml" : ""}`}
                    )
                );
            }
            this.entity.update();
            this.entity.sounds = [];
            for (const sound of target.sounds) {
                const filename = `${sound.assetId}.${sound.dataFormat}`;
                this.entity.sounds.push(
                    new File(
                        [await zip.file(filename)!.async("blob")],
                        `${sound.name}.${sound.dataFormat}`,
                        {type: `audio/${sound.dataFormat}`}
                    )
                );
            }
            this.entity.codeWorkspace.clear();
            for (const id in target.variables) {
                this.entity.codeWorkspace.createVariable(target.variables[id][0], null, id);
            }
            for (const block of Object.values(target.blocks)) {
                if (block.topLevel) {
                    this.block(block);
                }
            }

            if (target.isStage) {
                this.app.entities.unshift(this.entity);
                this.entity.render(this.app.stagePanel);
            } else {
                this.app.addSprite(this.entity as Sprite);
            }
        }
    }

    isProjectCompatible(project: Project) {
        if (project.extensions.length > 0 && project.extensions[0] !== "pen") {
            throw "Scrap does not support extensions other than the pen extension.";
        }
    }

    isTargetCompatible(target: Target) {
        if (Object.keys(target.lists).length) {
            throw "Scrap does not support lists.";
        }
    }

    input([shadow, data]: Input) {
        if (typeof data === "string") {
            const block = this.block(this.target.blocks[data]);
            block.setShadow(shadow === 1);
            return block;
        }
        if (data === null) {
            return null;
        }
        switch (data[0]) {
            case 4:
            case 5:
            case 6:
            case 7:
            case 8: {
                const block = this.entity.codeWorkspace.newBlock("math_number");
                block.setFieldValue(+data[1], "NUM");
                block.setShadow(shadow === 1);
                return block;
            }
            case 9: {
                const block = this.entity.codeWorkspace.newBlock("color");
                block.setFieldValue(data[1], "COLOR");
                block.setShadow(shadow === 1);
                return block;
            }
            case 10:
            case 11: {
                const block = this.entity.codeWorkspace.newBlock("iterables_string");
                block.setFieldValue(data[1], "TEXT");
                block.setShadow(shadow === 1);
                return block;
            }
            case 12: {
                const block = this.entity.codeWorkspace.newBlock("getVariable");
                block.setFieldValue(data[2], "VAR");
                block.setShadow(shadow === 1);
                return block;
            }
        }

        throw `Unknown input type: ${data[0]}`;
    }

    override({opcode, inputs = {}, extraState}: {
        opcode?: string;
        inputs?: Record<string, string>;
        extraState?: unknown;
    }) {
        return (data: Block) => {
            const block = this.entity.codeWorkspace.newBlock(opcode ?? data.opcode);

            if (extraState) {
                block.loadExtraState!(extraState);
            }

            for (const [name, input] of Object.entries(data.inputs)) {
                const {connection} = block.getInput(inputs[name] ?? name)!;
                const inner = this.input(input);

                if (inner && inner.previousConnection) {
                    connection!.connect(inner.previousConnection);
                } else if (inner && inner.outputConnection) {
                    connection!.connect(inner.outputConnection);
                }
            }
            return this.next(block, data);
        };
    }

    reporter(name: string) {
        return () => this.entity.codeWorkspace.newBlock(name);
    }

    next(block: Blockly.Block, data: Block) {
        if (data.next) {
            block.nextConnection!.connect(
                this.block(this.target.blocks[data.next]).previousConnection!
            );
        }
        return block;
    }

    block(data: Block): Blockly.Block {
        if (data.opcode in this.transformers) {
            return this.transformers[data.opcode](data);
        }
        throw `Unsupported Scratch block type: ${data.opcode}`;
    }
}

export default SB3;