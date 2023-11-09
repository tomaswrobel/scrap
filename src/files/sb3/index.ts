import JSZip from "jszip";
import {Entity, Sprite, Stage} from "../../entities";
import type {Project, Target, Block, Input} from "./types";
import type App from "../../app";
import * as Blockly from "blockly/core";

class SB3 {
    target!: Target;
    entity!: Entity;

    transformers: Record<string, (data: Block) => Blockly.Block> = {};

    constructor(private app: App) {
        this.transformers.motion_movesteps = this.override({
            opcode: "move"
        });
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
            inputs: {
                DX: ["X"]
            }
        });
        this.transformers.motion_setx = this.override({
            opcode: "setX"
        });
        this.transformers.motion_changeyby = this.override({
            opcode: "changeY",
            inputs: {
                DY: ["Y"]
            }
        });
        this.transformers.motion_sety = this.override({
            opcode: "setY"
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
        this.transformers.looks_changeeffectby = this.transformers.looks_seteffectto = data => {
            const effect = this.effect(data);

            if (!effect) {
                return this.unknown(`${data.opcode} [${data.fields.EFFECT[0]}]`, "command");
            }

            const block = this.entity.codeWorkspace.newBlock(data.opcode === "looks_seteffectto" ? "setEffect" : "changeEffect");
            block.getInput("EFFECT")!.connection!.connect(effect);
            block.getInput("CHANGE")!.connection!.connect(
                this.input(data.inputs.VALUE)!.outputConnection!
            );

            return block;
        };
        this.transformers.looks_cleargraphiceffects = this.override({
            opcode: "clearEffects"
        });
        this.transformers.looks_changesizeby = this.override({
            opcode: "changeSize",
            inputs: {
                CHANGE: ["SIZE"]
            }
        });
        this.transformers.looks_setsizeto = this.override({
            opcode: "setSize",
        });
        this.transformers.looks_size = this.reporter("size");
        this.transformers.looks_costume = this.transformers.looks_backdrop = data => {
            const block = this.entity.codeWorkspace.newBlock("costume_menu");
            block.setFieldValue(this.assetMap[data.fields.COSTUME[0]], "NAME");
            return block;
        };
        this.transformers.looks_switchcostumeto = this.override({
            opcode: "switchCostumeTo",
        });
        this.transformers.looks_nextcostume = this.override({
            opcode: "nextCostume",
        });
        this.transformers.looks_switchbackdropto = this.override({
            opcode: "switchBackdropTo",
            inputs: {
                BACKDROP: ["COSTUME"]
            }
        });
        this.transformers.looks_gotofrontback = data => {
            return data.fields.FRONT_BACK[0] === "front"
                ? this.entity.codeWorkspace.newBlock("goToFront")
                : this.entity.codeWorkspace.newBlock("goToBack")
                ;
        };
        this.transformers.looks_goforwardbackwardlayers = data => {
            return data.fields.FORWARD_BACKWARD[0] === "forward"
                ? this.entity.codeWorkspace.newBlock("goForward")
                : this.entity.codeWorkspace.newBlock("goBackward")
                ;
        };
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
            inputs: {
                SOUND_MENU: ["SOUND"]
            }
        });
        this.transformers.sound_playuntildone = this.override({
            opcode: "playSoundUntilDone",
            inputs: {
                SOUND_MENU: ["SOUND"]
            }
        });
        this.transformers.sound_stopallsounds = this.override({
            opcode: "stopSounds"
        });
        this.transformers.sound_setvolumeto = this.override({
            opcode: "setVolume"
        });
        this.transformers.sound_changevolumeby = this.override({
            opcode: "changeVolume",
            inputs: {
                VOLUME: ["VALUE"]
            }
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
        this.transformers.event_whengreaterthan = data => {
            if (data.fields.WHENGREATERTHANMENU[0] === "TIMER") {
                const block = this.entity.codeWorkspace.newBlock("whenTimerElapsed");
                block.getInput("TIMER")!.connection!.connect(
                    this.input(data.inputs.VALUE)!.outputConnection!
                );
                return block;
            } else {
                return this.unknown("event_whengreaterthan [volume]", "command");
            }
        };
        this.transformers.event_whenthisspriteclicked = data => {
            const block = this.entity.codeWorkspace.newBlock("whenMouse");
            block.getInput("EVENT")!.connection!.connect(
                this.entity.codeWorkspace.newBlock("event")!.outputConnection!
            );
            return block;
        };
        this.transformers.event_whenstageclicked = this.transformers.event_whenthisspriteclicked;
        this.transformers.event_whenbroadcastreceived = data => {
            const block = this.entity.codeWorkspace.newBlock("whenReceiveMessage");
            const message = this.entity.codeWorkspace.newBlock("iterables_string");
            message.setFieldValue(data.fields.BROADCAST_OPTION[0], "TEXT");
            message.setShadow(true);
            block.getInput("MESSAGE")!.connection!.connect(message.outputConnection!);
            return block;
        };
        this.transformers.event_broadcast = this.override({
            opcode: "broadcastMessage",
            inputs: {
                BROADCAST_INPUT: ["MESSAGE"]
            }
        });
        this.transformers.event_broadcastandwait = this.override({
            opcode: "broadcastMessageWait",
            inputs: {
                BROADCAST_INPUT: ["MESSAGE"]
            }
        });

        // Control
        this.transformers.control_wait = this.override({
            opcode: "wait",
            inputs: {
                DURATION: ["SECS"]
            }
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
                    this.input(data.inputs.SUBSTACK, true)!.previousConnection!
                );
            }

            return block;
        };
        this.transformers.control_wait_until = this.transformers.control_repeat_until;
        this.transformers.control_repeat = this.override({
            opcode: "repeat",
            inputs: {
                SUBSTACK: ["STACK", true]
            }
        });
        this.transformers.control_start_as_clone = this.override({
            opcode: "whenCloned"
        });
        this.transformers.control_forever = data => {
            const block = this.entity.codeWorkspace.newBlock("while");

            if ("SUBSTACK" in data.inputs) {
                block.getInput("STACK")!.connection!.connect(
                    this.input(data.inputs.SUBSTACK, true)!.previousConnection!
                );
            }

            const trueBlock = this.entity.codeWorkspace.newBlock("boolean");
            trueBlock.setFieldValue("true", "BOOL");

            block.getInput("CONDITION")!.connection!.connect(trueBlock.outputConnection!);

            return block;
        };
        this.transformers.control_if = this.override({
            inputs: {
                SUBSTACK: ["DO0", true],
                CONDITION: ["IF0"]
            },
            opcode: "controls_if"
        });
        this.transformers.control_if_else = this.override({
            inputs: {
                SUBSTACK: ["DO0", true],
                SUBSTACK2: ["ELSE", true],
                CONDITION: ["IF0"]
            },
            opcode: "controls_if",
            extraState: {
                hasElse: true
            }
        });

        // Sensing
        this.transformers.sensing_touchingobject = data => {
            const fieldValue = this.target.blocks[data.inputs.TOUCHINGOBJECTMENU[1] as string].fields.TOUCHINGOBJECTMENU[0];

            if (fieldValue === "_edge_") {
                return this.entity.codeWorkspace.newBlock("isTouchingEdge");
            } else if (fieldValue === "_mouse_") {
                return this.entity.codeWorkspace.newBlock("isTouchingMouse");
            } else {
                const block = this.entity.codeWorkspace.newBlock("isTouching");
                block.getInput("SPRITE")!.connection!.connect(this.setSprite(fieldValue));
                return block;
            }
        };
        this.transformers.sensing_touchingcolor = this.override({
            opcode: "isTouchingBackdropColor",
        });
        this.transformers.sensing_distanceto = data => {
            // Scrap does not have "distance to [object]" block,
            // rather it has "distance to [x: number] [y: number]" block.
            const fieldValue = this.target.blocks[data.inputs.DISTANCETOMENU[1] as string].fields.DISTANCETOMENU[0];
            const block = this.entity.codeWorkspace.newBlock("distanceTo");
            if (fieldValue === "_mouse_") {
                block.getInput("X")!.connection!.connect(
                    this.entity.codeWorkspace.newBlock("mouseX")!.outputConnection!
                );
                block.getInput("Y")!.connection!.connect(
                    this.entity.codeWorkspace.newBlock("mouseY")!.outputConnection!
                );
            } else {
                const x = this.entity.codeWorkspace.newBlock("property");
                x.setFieldValue("x", "PROPERTY");
                x.getInput("SPRITE")!.connection!.connect(this.setSprite(fieldValue));

                const y = this.entity.codeWorkspace.newBlock("property");
                y.setFieldValue("y", "PROPERTY");
                y.getInput("SPRITE")!.connection!.connect(this.setSprite(fieldValue));

                block.getInput("X")!.connection!.connect(x.outputConnection!);
                block.getInput("Y")!.connection!.connect(y.outputConnection!);
            }
            return block;
        };
        this.transformers.sensing_askandwait = data => {
            this.helperVariable("scratch_answer", "String");
            const block = this.entity.codeWorkspace.newBlock("setVariable");
            const ask = this.entity.codeWorkspace.newBlock("ask");
            ask.getInput("QUESTION")!.connection!.connect(
                this.input(data.inputs.QUESTION)!.outputConnection!
            );
            block.setFieldValue("scratch_answer", "VAR");
            block.getInput("VALUE")!.connection!.connect(ask.outputConnection!);
            return block;
        };
        this.transformers.sensing_answer = () => {
            this.helperVariable("scratch_answer", "String");
            const block = this.entity.codeWorkspace.newBlock("getVariable");
            block.setFieldValue("scratch_answer", "VAR");
            return block;
        };
        this.transformers.sensing_keyoptions = data => {
            const block = this.entity.codeWorkspace.newBlock("key");

            switch (data.fields.KEY_OPTION[0]) {
                case "space":
                    block.setFieldValue("Space", "KEY");
                    break;
                case "left arrow":
                    block.setFieldValue("ArrowLeft", "KEY");
                    break;
                case "right arrow":
                    block.setFieldValue("ArrowRight", "KEY");
                    break;
                case "up arrow":
                    block.setFieldValue("ArrowUp", "KEY");
                    break;
                case "down arrow":
                    block.setFieldValue("ArrowDown", "KEY");
                    break;
                default:
                    block.setFieldValue(data.fields.KEY_OPTION[0], "KEY");
                    break;
            }

            return block;
        };
        this.transformers.sensing_keypressed = this.override({
            opcode: "isKeyPressed",
            inputs: {
                KEY_OPTION: ["KEY"]
            }
        });
        this.transformers.sensing_mousedown = this.reporter("mouseDown");
        this.transformers.sensing_mousex = this.reporter("mouseX");
        this.transformers.sensing_mousey = this.reporter("mouseY");
        this.transformers.sensing_setdragmode = data => {
            const block = this.entity.codeWorkspace.newBlock("setDragMode");
            if (data.fields.DRAG_MODE[0] === "draggable") {
                const trueBlock = this.entity.codeWorkspace.newBlock("boolean");
                trueBlock.setFieldValue("true", "BOOL");
                block.getInput("DRAGGABLE")!.connection!.connect(trueBlock.outputConnection!);
            } else if (data.fields.DRAG_MODE[0] === "not draggable") {
                const falseBlock = this.entity.codeWorkspace.newBlock("boolean");
                falseBlock.setFieldValue("false", "BOOL");
                block.getInput("DRAGGABLE")!.connection!.connect(falseBlock.outputConnection!);
            }
            return block;
        };
        this.transformers.sensing_timer = this.reporter("getTimer");
        this.transformers.sensing_resettimer = this.override({
            opcode: "resetTimer"
        });

        this.transformers.operator_add = this.operator("arithmetics", "+");
        this.transformers.operator_subtract = this.operator("arithmetics", "-");
        this.transformers.operator_multiply = this.operator("arithmetics", "*");
        this.transformers.operator_divide = this.operator("arithmetics", "/");

        this.transformers.operator_random = data => {
            const fromParam = this.entity.codeWorkspace.newBlock("parameter");
            fromParam.setFieldValue("__from__", "VAR");

            const toParam = this.entity.codeWorkspace.newBlock("parameter");
            toParam.setFieldValue("__to__", "VAR");

            const multiply = this.entity.codeWorkspace.newBlock("arithmetics");
            multiply.setFieldValue("*", "OP");

            const add = this.entity.codeWorkspace.newBlock("arithmetics");
            add.setFieldValue("+", "OP");

            const subtract = this.entity.codeWorkspace.newBlock("arithmetics");
            subtract.setFieldValue("-", "OP");

            const floor = this.entity.codeWorkspace.newBlock("math");
            floor.setFieldValue("floor", "OP");

            const one = this.entity.codeWorkspace.newBlock("math_number");
            one.setFieldValue("1", "NUM");

            const returnBlock = this.entity.codeWorkspace.newBlock("return");
            returnBlock.loadExtraState!({output: "Number"});

            const random = this.entity.codeWorkspace.newBlock("random");

            // Connections
            multiply.getInput("A")!.connection!.connect(random.outputConnection!);
            multiply.getInput("B")!.connection!.connect(subtract.outputConnection!);
            subtract.getInput("A")!.connection!.connect(toParam.outputConnection!);
            subtract.getInput("B")!.connection!.connect(fromParam.outputConnection!);

            floor.getInput("NUM")!.connection!.connect(multiply.outputConnection!);
            add.getInput("A")!.connection!.connect(floor.outputConnection!);
            add.getInput("B")!.connection!.connect(one.outputConnection!);

            const name = this.provide({
                args: [
                    {
                        name: "__from__",
                        type: "number"
                    },
                    {
                        name: "__to__",
                        type: "number"
                    }
                ],
                name: "random",
                returns: "Number"
            }, returnBlock);

            if (returnBlock.disposed) {
                add.dispose(false);
            } else {
                returnBlock.getInput("VALUE")!.connection!.connect(add.outputConnection!);
            }

            const block = this.entity.codeWorkspace.newBlock("call");
            block.loadExtraState!({
                name,
                params: [
                    "Number",
                    "Number"
                ],
                returnType: "Number"
            });

            block.getInput("PARAM_0")!.connection!.connect(
                this.input(data.inputs.FROM)!.outputConnection!
            );
            block.getInput("PARAM_1")!.connection!.connect(
                this.input(data.inputs.TO)!.outputConnection!
            );

            return block;
        };

        this.transformers.operator_lt = this.operator("compare", "<");
        this.transformers.operator_equals = this.operator("compare", "==");
        this.transformers.operator_gt = this.operator("compare", ">");
        this.transformers.operator_and = this.operator("operation", "&&");
        this.transformers.operator_or = this.operator("operation", "||");

        this.transformers.operator_not = this.override({
            opcode: "not",
            inputs: {
                OPERAND: ["BOOL"]
            }
        });

        // Scratch uses 1-based indexing, while Scrap uses 0-based indexing.
        this.transformers.operator_letter_of = data => {
            const block = this.entity.codeWorkspace.newBlock("item");
            const minus = this.entity.codeWorkspace.newBlock("arithmetics");
            minus.setFieldValue("-", "OP");
            const one = this.entity.codeWorkspace.newBlock("math_number");
            one.setFieldValue("1", "NUM");
            minus.getInput("A")!.connection!.connect(
                this.input(data.inputs.LETTER)!.outputConnection!
            );
            minus.getInput("B")!.connection!.connect(one.outputConnection!);

            block.getInput("INDEX")!.connection!.connect(minus.outputConnection!);
            block.getInput("ITERABLE")!.connection!.connect(
                this.input(data.inputs.STRING)!.outputConnection!
            );

            return block;
        };

        this.transformers.operator_length = this.override({
            opcode: "length",
            inputs: {
                STRING: ["ITERABLE"]
            }
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
            default:
                block.dispose(false);
                return null;
        }

        block.setShadow(true);

        return block.outputConnection!;
    }

    operator(type: "compare" | "arithmetics" | "operation", operator: string) {
        const input = type === "arithmetics" ? "NUM" : "OPERAND";
        return (data: Block) => {
            const block = this.entity.codeWorkspace.newBlock(type);
            block.setFieldValue(operator, "OP");
            block.getInput("A")!.connection!.connect(
                this.input(data.inputs[`${input}1`])!.outputConnection!
            );
            block.getInput("B")!.connection!.connect(
                this.input(data.inputs[`${input}2`])!.outputConnection!
            );
            return block;
        };
    }

    assetMap: Record<string, string> = {};

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
                this.assetMap[costume.name] = `${costume.name}.${costume.dataFormat}`;
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
            if (!target.isStage) {
                for (const id in project.targets[0].variables) {
                    this.entity.codeWorkspace.createVariable(project.targets[0].variables[id][0], null, id);
                }
            }
            this.provided = {};
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
        if (project.extensions.length > 0) {
            if (project.extensions.length === 1 && project.extensions[0] === "pen") {
                return;
            }
            throw "Scrap does not support extensions other than the pen extension.";
        }
    }

    isTargetCompatible(target: Target) {
        if (Object.keys(target.lists).length) {
            throw "Scrap does not support lists.";
        }
    }

    private setSprite(name: string) {
        const block = this.entity.codeWorkspace.newBlock("sprite");
        block.setFieldValue(name, "SPRITE");
        block.setShadow(true);
        return block.outputConnection!;
    }

    private helperVariable(id: string, type: string) {
        if (!this.entity.codeWorkspace.getVariableById(id)) {
            this.entity.codeWorkspace.createVariable(
                Blockly.Variables.generateUniqueName(this.entity.codeWorkspace),
                type,
                id
            );
            return true;
        }
        return false;
    }

    input([shadow, data]: Input, command = false) {
        if (typeof data === "string") {
            const block = this.block(
                this.target.blocks[data],
                !command
            );
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

    /**
     * Most Scratch blocks are directly supported by Scrap,
     * but with different naming. This function is used to
     * just interchange the input names and opcode.
     * @param config The renaming configuration.
     */
    override({opcode, inputs = {}, extraState}: SB3.Override) {
        return (data: Block) => {
            const block = this.entity.codeWorkspace.newBlock(opcode ?? data.opcode);

            if (extraState) {
                block.loadExtraState!(extraState);
            }

            for (const [name, input] of Object.entries(data.inputs)) {
                const {connection} = block.getInput(name in inputs ? inputs[name][0] : name)!;
                const inner = this.input(input, name in inputs ? inputs[name][1] : false);

                if (inner && inner.previousConnection) {
                    connection!.connect(inner.previousConnection);
                } else if (inner && inner.outputConnection) {
                    connection!.connect(inner.outputConnection);
                }
            }
            return block;
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

    block(data: Block, isInput?: boolean): Blockly.Block {
        if (data.opcode in this.transformers) {
            var block = this.transformers[data.opcode](data);
        } else {
            var block = this.unknown(data.opcode, isInput ? "reporter" : "command");
        }
        if (data.next) {
            block.nextConnection!.connect(
                this.block(this.target.blocks[data.next]).previousConnection!
            );
        }
        return block;
    }

    unknown(opcode: string, shape: "reporter" | "command") {
        const block = this.entity.codeWorkspace.newBlock("unknown");
        block.loadExtraState!({shape, opcode});
        return block;
    }

    provided!: Record<string, string>;
    /**
     * Some Scratch blocks do not have a corresponding block in Scrap.
     * However, it is sometimes possible to emulate the block using a function.
     * This is a helper function to create a function that can be used to emulate a block.
     */
    provide(init: SB3.Provide, _block: Blockly.Block) {
        if (init.name in this.provided) {
            _block.dispose(false);
            return this.provided[init.name];
        }

        const name = `scratch_${init.name}_${Date.now().toString(36)}`;
        let block = this.entity.codeWorkspace.newBlock("function");

        block.loadExtraState!({
            name,
            params: init.args,
            returnType: init.returns
        });

        block.nextConnection!.connect(_block.previousConnection!);

        return this.provided[init.name] = name;
    }
}

declare namespace SB3 {
    interface Override {
        opcode?: string;
        inputs?: Record<string, [string, boolean?]>;
        extraState?: unknown;
    }

    interface Provide {
        returns: string;
        args: {
            name: string;
            type: string;
        }[];
        name: string;
    }
}

export default SB3;