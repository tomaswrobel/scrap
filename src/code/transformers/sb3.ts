/**
 * This file is a part of Scrap, an educational programming language.
 * You should have received a copy of the MIT License, if not, please 
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap. 
 * 
 * @license MIT
 * @fileoverview Scratch converter
 * @author Tomáš Wróbel
 */
import JSZip from "jszip";
import {Sprite, Stage} from "../../components/entity";
import * as Blockly from "blockly";
import {escape} from "./utils";

const illegalRe = /[\/\?<>\\:\*\|":#]+/g;
const controlRe = /[\x00-\x1f\x80-\x9f]/g;
const reservedRe = /^\.+$/;

class SB3 {
    transformers: Record<string, (data: SB3.Block) => Promise<Blockly.Block> | Blockly.Block> = {};

    constructor() {
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
        this.transformers.motion_goto_menu = async data => {
            const block = app.current.workspace.newBlock("sprite");
            block.setFieldValue(data.fields.TO[0], "SPRITE");
            return block;
        };
        this.transformers.motion_goto = async data => {
            const block = app.current.workspace.newBlock("goTowards");
            const to = await this.input(data.inputs.TO);
            block.getInput("SPRITE")?.connection?.connect(to!.outputConnection!);
            return block;
        };
        this.transformers.motion_changexby = this.setter("change", "x", "DX");
        this.transformers.motion_changeyby = this.setter("change", "y", "DY");
        this.transformers.motion_sety = this.setter("set", "y", "Y");
        this.transformers.motion_setx = this.setter("set", "x", "X");
        this.transformers.motion_ifonedgebounce = this.override({
            opcode: "ifOnEdgeBounce"
        });
        this.transformers.motion_setrotationstyle = data => {
            const block = app.current.workspace.newBlock("setRotationStyle");
            block.getInput("STYLE")?.connection!.setShadowState({
                type: "rotationStyle",
                fields: {
                    STYLE: data.fields.STYLE[0]
                }
            });
            return block;
        };

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
        this.transformers.looks_changeeffectby = this.transformers.looks_seteffectto = async data => {
            if (data.fields.EFFECT[0] !== "color" && data.fields.EFFECT[0] !== "brightness" && data.fields.EFFECT[0] !== "ghost") {
                return this.unknown(`${data.opcode} [${data.fields.EFFECT[0]}]`, "command");
            }

            const value = await this.input(data.inputs.VALUE);
            const block = app.current.workspace.newBlock(data.opcode === "looks_seteffectto" ? "set" : "change");
            block.getInput("VAR")?.connection!.setShadowState({
                type: "effect",
                fields: {
                    EFFECT: data.fields.EFFECT[0]
                }
            });
            block.getInput("VALUE")?.connection?.connect(value!.outputConnection!);

            return block;
        };
        this.transformers.looks_cleargraphiceffects = this.override({
            opcode: "clearEffects"
        });
        this.transformers.looks_changesizeby = this.setter("change", "size", "CHANGE");
        this.transformers.looks_setsizeto = this.setter("set", "size", "SIZE");
        this.transformers.looks_size = this.reporter("size");
        this.transformers.looks_costume = data => {
            const block = app.current.workspace.newBlock("costume_menu");
            block.setFieldValue(this.assetMap[data.fields.COSTUME[0]], "NAME");
            return block;
        };
        this.transformers.looks_backdrops = data => {
            const block = app.current.workspace.newBlock("backdrop_menu");
            block.setFieldValue(this.assetMap[data.fields.BACKDROP[0]], "NAME");
            return block;
        };
        this.transformers.looks_switchcostumeto = async data => {
            const block = app.current.workspace.newBlock("switchCostumeTo");
            const input = await this.input(data.inputs.COSTUME);

            if (input!.outputConnection!.getCheck()![0] === "number") {
                const one = app.current.workspace.newBlock("math_number");
                one.setFieldValue("1", "NUM");

                const subtract = app.current.workspace.newBlock("arithmetics");
                subtract.setFieldValue("-", "OP");

                subtract.getInput("A")?.connection?.connect(input!.outputConnection!);
                subtract.getInput("B")?.connection?.connect(one.outputConnection!);

                block.getInput("COSTUME")?.connection?.connect(subtract.outputConnection!);
            } else {
                block.getInput("COSTUME")?.connection?.connect(input!.outputConnection!);
            }

            return block;
        };
        this.transformers.looks_nextcostume = this.override({
            opcode: "nextCostume",
        });
        this.transformers.looks_switchbackdropto = async data => {
            const block = app.current.workspace.newBlock("switchBackdropTo");
            const input = await this.input(data.inputs.BACKDROP);

            if (input!.outputConnection!.getCheck()![0] === "number") {
                const one = app.current.workspace.newBlock("math_number");
                one.setFieldValue("1", "NUM");

                const subtract = app.current.workspace.newBlock("arithmetics");
                subtract.setFieldValue("-", "OP");

                subtract.getInput("A")?.connection?.connect(input!.outputConnection!);
                subtract.getInput("B")?.connection?.connect(one.outputConnection!);

                block.getInput("COSTUME")?.connection?.connect(subtract.outputConnection!);
            } else {
                block.getInput("COSTUME")?.connection?.connect(input!.outputConnection!);
            }

            return block;
        };
        this.transformers.looks_switchbackdroptoandwait = this.override({
            opcode: "switchBackdropToWait"
        });
        this.transformers.looks_gotofrontback = data => {
            return data.fields.FRONT_BACK[0] === "front"
                ? app.current.workspace.newBlock("goToFront")
                : app.current.workspace.newBlock("goToBack")
                ;
        };
        this.transformers.looks_goforwardbackwardlayers = data => {
            return data.fields.FORWARD_BACKWARD[0] === "forward"
                ? app.current.workspace.newBlock("goForward")
                : app.current.workspace.newBlock("goBackward")
                ;
        };
        this.transformers.looks_costumenumbername = this.asset("costume");
        this.transformers.looks_backdropnumbername = this.asset("backdrop");
        this.transformers.looks_nextbackdrop = this.override({opcode: "nextBackdrop"});

        // Sounds
        this.transformers.sound_sounds_menu = data => {
            const block = app.current.workspace.newBlock("sound");
            block.setFieldValue(data.fields.SOUND_MENU[0], "NAME");
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
        this.transformers.sound_setvolumeto = this.setter("set", "volume", "VOLUME");
        this.transformers.sound_changevolumeby = this.setter("change", "volume", "VOLUME");
        this.transformers.sound_volume = this.reporter("volume");

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
        this.transformers.pen_setPenColorToColor = this.setter("set", "penColor", "COLOR");
        this.transformers.pen_changePenSizeBy = this.setter("change", "penSize", "SIZE");
        this.transformers.pen_setPenSizeTo = this.setter("set", "penSize", "SIZE");

        // Events
        this.transformers.event_whenflagclicked = this.override({
            opcode: "whenFlag"
        });
        this.transformers.event_whengreaterthan = async data => {
            if (data.fields.WHENGREATERTHANMENU[0] === "TIMER") {
                const block = app.current.workspace.newBlock("whenTimerElapsed");
                const value = await this.input(data.inputs.VALUE);
                block.getInput("TIMER")?.connection?.connect(value!.outputConnection!);
                return block;
            } else {
                return this.unknown("event_whengreaterthan [volume]", "command");
            }
        };
        this.transformers.event_whenthisspriteclicked = () => {
            const block = app.current.workspace.newBlock("whenMouse");
            block.getInput("EVENT")?.connection!.setShadowState({type: "event"});
            return block;
        };
        this.transformers.event_whenstageclicked = this.transformers.event_whenthisspriteclicked;
        this.transformers.event_whenbroadcastreceived = data => {
            const block = app.current.workspace.newBlock("whenReceiveMessage");
            block.getInput("MESSAGE")?.connection!.setShadowState({
                type: "iterables_string",
                fields: {
                    TEXT: data.fields.BROADCAST_OPTION[0]
                }
            });
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
        this.transformers.event_whenbackdropswitchesto = data => {
            const block = app.current.workspace.newBlock("whenBackdropChangesTo");
            block.getInput("BACKDROP")?.connection!.setShadowState({
                type: "backdrop",
                fields: {
                    BACKDROP: data.fields.BACKDROP[0]
                }
            });
            return block;
        };
        this.transformers.event_whenkeypressed = data => {
            const key = app.current.workspace.newBlock("key");

            switch (data.fields.KEY_OPTION[0]) {
                case "space":
                    key.setFieldValue("Space", "KEY");
                    break;
                case "left arrow":
                    key.setFieldValue("ArrowLeft", "KEY");
                    break;
                case "right arrow":
                    key.setFieldValue("ArrowRight", "KEY");
                    break;
                case "up arrow":
                    key.setFieldValue("ArrowUp", "KEY");
                    break;
                case "down arrow":
                    key.setFieldValue("ArrowDown", "KEY");
                    break;
                default:
                    key.setFieldValue(data.fields.KEY_OPTION[0], "KEY");
                    break;
            }

            const block = app.current.workspace.newBlock("whenKeyPressed");
            block.getInput("KEY")?.connection?.connect(key.outputConnection!);
            return block;
        };

        // Control
        this.transformers.control_wait = this.override({
            opcode: "wait",
            inputs: {
                DURATION: ["SECS"]
            }
        });
        this.transformers.control_repeat_until = async data => {
            const block = app.current.workspace.newBlock("while");
            const not = app.current.workspace.newBlock("not");

            const condition = await this.input(data.inputs.CONDITION);
            if (condition) {
                not.getInput("BOOL")?.connection?.connect(condition.outputConnection!);
            }

            block.getInput("CONDITION")?.connection?.connect(not.outputConnection!);

            if ("SUBSTACK" in data.inputs) {
                const inner = await this.input(data.inputs.SUBSTACK, true);
                block.getInput("STACK")?.connection?.connect(inner!.previousConnection!);
            }

            return block;
        };
        this.transformers.control_wait_until = this.transformers.control_repeat_until;
        this.transformers.control_stop = data => {
            const options = data.fields.STOP_OPTION[0];

            if (options === "all") {
                return app.current.workspace.newBlock("stop");
            } else if (options === "this script") {
                return app.current.workspace.newBlock("return");
            } else {
                return this.unknown(`control_stop [${options}]`, "command");
            }
        };
        this.transformers.control_repeat = async data => {
            const block = app.current.workspace.newBlock("for");
            const times = await this.input(data.inputs.TIMES);

            block.getInput("FROM")?.connection!.setShadowState({
                type: "math_number",
                fields: {NUM: "1"}
            });

            block.getInput("TO")?.connection?.connect(times!.outputConnection!);

            if ("SUBSTACK" in data.inputs) {
                const inner = await this.input(data.inputs.SUBSTACK, true);
                block.getInput("STACK")?.connection?.connect(inner!.previousConnection!);
            }

            return block;
        };
        this.transformers.control_start_as_clone = this.override({
            opcode: "whenCloned"
        });
        this.transformers.control_create_clone_of = data => {
            const field = this.target.blocks[data.inputs.CLONE_OPTION[1] as string].fields.CLONE_OPTION[0];
            const block = app.current.workspace.newBlock("clone");
            block.getInput("SPRITE")?.connection!.setShadowState({
                type: "sprite",
                fields: {
                    SPRITE: field === "_myself_" ? "self" : field
                }
            });
            return block;
        };
        this.transformers.control_delete_this_clone = () => (
            app.current.workspace.newBlock("delete")
        );
        this.transformers.control_forever = async data => {
            const block = app.current.workspace.newBlock("while");

            if ("SUBSTACK" in data.inputs) {
                const inner = await this.input(data.inputs.SUBSTACK, true);
                block.getInput("STACK")?.connection?.connect(
                    inner!.previousConnection!
                );
            }

            const trueBlock = app.current.workspace.newBlock("boolean");
            trueBlock.setFieldValue("true", "BOOL");

            block.getInput("CONDITION")?.connection?.connect(trueBlock.outputConnection!);

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
        this.transformers.sensing_of = async data => {
            const fieldValue = this.target.blocks[data.inputs.OBJECT[1] as string].fields.OBJECT[0];

            const block = app.current.workspace.newBlock("property");
            block.setFieldValue(fieldValue === "_stage_" ? "Stage" : fieldValue, "SPRITE");

            switch (data.fields.PROPERTY[0]) {
                case "x position":
                    block.setFieldValue("x", "PROPERTY");
                    break;
                case "y position":
                    block.setFieldValue("y", "PROPERTY");
                    break;
                default:
                    block.setFieldValue(data.fields.PROPERTY[0], "PROPERTY");
            }


            return block;
        };
        this.transformers.sensing_touchingobject = data => {
            const fieldValue = this.target.blocks[data.inputs.TOUCHINGOBJECTMENU[1] as string].fields.TOUCHINGOBJECTMENU[0];

            if (fieldValue === "_edge_") {
                return app.current.workspace.newBlock("isTouchingEdge");
            } else if (fieldValue === "_mouse_") {
                return app.current.workspace.newBlock("isTouchingMouse");
            } else {
                const block = app.current.workspace.newBlock("isTouching");
                block.getInput("SPRITE")?.connection!.setShadowState({
                    type: "sprite",
                    fields: {
                        SPRITE: fieldValue
                    }
                });
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
            const block = app.current.workspace.newBlock("distanceTo");
            if (fieldValue === "_mouse_") {
                block.getInput("X")?.connection?.connect(
                    app.current.workspace.newBlock("mouseX")!.outputConnection!
                );
                block.getInput("Y")?.connection?.connect(
                    app.current.workspace.newBlock("mouseY")!.outputConnection!
                );
            } else {
                const x = app.current.workspace.newBlock("property");
                x.setFieldValue("x", "PROPERTY");
                x.getInput("SPRITE")?.connection!.setShadowState({
                    type: "sprite",
                    fields: {
                        SPRITE: fieldValue
                    }
                });

                const y = app.current.workspace.newBlock("property");
                y.setFieldValue("y", "PROPERTY");
                y.getInput("SPRITE")?.connection!.setShadowState({
                    type: "sprite",
                    fields: {
                        SPRITE: fieldValue
                    }
                });

                block.getInput("X")?.connection?.connect(x.outputConnection!);
                block.getInput("Y")?.connection?.connect(y.outputConnection!);
            }
            return block;
        };
        const answer = (function () {
            let name = "";

            return () => {
                const block = app.current.workspace.newBlock("parameter");
                block.loadExtraState!({type: "string", isVariable: true});
                block.setFieldValue(
                    name || (
                        name = Blockly.Variables.generateUniqueNameFromOptions(
                            "a",
                            app.current.variables.map(e => e[0])
                        )
                    ),
                    "VAR"
                );
                return block;
            };
        })();
        this.transformers.sensing_askandwait = async data => {
            const block = app.current.workspace.newBlock("set");
            block.getInput("VAR")?.connection?.connect(answer().outputConnection!);
            const ask = app.current.workspace.newBlock("ask");
            const question = await this.input(data.inputs.QUESTION);
            ask.getInput("QUESTION")?.connection?.connect(question!.outputConnection!);
            block.getInput("VALUE")?.connection?.connect(ask.outputConnection!);
            return block;
        };
        this.transformers.sensing_answer = answer;
        this.transformers.sensing_keyoptions = data => {
            const block = app.current.workspace.newBlock("key");

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
            const block = app.current.workspace.newBlock("set");
            block.getInput("VAR")?.connection!.setShadowState({type: "draggable"});
            if (data.fields.DRAG_MODE[0] === "draggable") {
                const trueBlock = app.current.workspace.newBlock("boolean");
                trueBlock.setFieldValue("true", "BOOL");
                block.getInput("VALUE")?.connection?.connect(trueBlock.outputConnection!);
            } else if (data.fields.DRAG_MODE[0] === "not draggable") {
                const falseBlock = app.current.workspace.newBlock("boolean");
                falseBlock.setFieldValue("false", "BOOL");
                block.getInput("VALUE")?.connection?.connect(falseBlock.outputConnection!);
            }
            return block;
        };
        this.transformers.sensing_timer = this.reporter("getTimer");
        this.transformers.sensing_resettimer = this.override({
            opcode: "resetTimer"
        });

        // Operators
        this.transformers.operator_add = this.operator("arithmetics", "+");
        this.transformers.operator_subtract = this.operator("arithmetics", "-");
        this.transformers.operator_multiply = this.operator("arithmetics", "*");
        this.transformers.operator_divide = this.operator("arithmetics", "/");

        this.transformers.operator_random = async data => {
            const fromParam = app.current.workspace.newBlock("parameter");
            fromParam.loadExtraState!({type: "number"});
            fromParam.setFieldValue("__from__", "VAR");

            const toParam = app.current.workspace.newBlock("parameter");
            toParam.loadExtraState!({type: "number"});
            toParam.setFieldValue("__to__", "VAR");

            const multiply = app.current.workspace.newBlock("arithmetics");
            multiply.setFieldValue("*", "OP");

            const add = app.current.workspace.newBlock("arithmetics");
            add.setFieldValue("+", "OP");

            const subtract = app.current.workspace.newBlock("arithmetics");
            subtract.setFieldValue("-", "OP");

            const floor = app.current.workspace.newBlock("math");
            floor.setFieldValue("floor", "OP");

            const one = app.current.workspace.newBlock("math_number");
            one.setFieldValue("1", "NUM");

            const returnBlock = app.current.workspace.newBlock("return");
            returnBlock.loadExtraState!({output: "number"});

            const random = app.current.workspace.newBlock("random");

            // Connections
            multiply.getInput("A")?.connection?.connect(random.outputConnection!);
            multiply.getInput("B")?.connection?.connect(subtract.outputConnection!);
            subtract.getInput("A")?.connection?.connect(toParam.outputConnection!);
            subtract.getInput("B")?.connection?.connect(fromParam.outputConnection!);

            floor.getInput("NUM")?.connection?.connect(multiply.outputConnection!);
            add.getInput("A")?.connection?.connect(floor.outputConnection!);
            add.getInput("B")?.connection?.connect(one.outputConnection!);

            const name = this.provide(returnBlock, {
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
                returns: "number",
                comment: "Returns a random number between\n__from__ and __to__ inclusive.\n(JavaScript does not have such a function.)"
            });

            if (returnBlock.disposed) {
                add.dispose(false);
            } else {
                returnBlock.getInput("VALUE")?.connection?.connect(add.outputConnection!);
            }

            const block = app.current.workspace.newBlock("call");
            block.loadExtraState!({
                name,
                params: [
                    "number",
                    "number"
                ],
                returnType: "number"
            });

            const from = await this.input(data.inputs.FROM);
            const to = await this.input(data.inputs.TO);

            block.getInput("PARAM_0")?.connection?.connect(from!.outputConnection!);
            block.getInput("PARAM_1")?.connection?.connect(to!.outputConnection!);

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
        this.transformers.operator_letter_of = async data => {
            const block = app.current.workspace.newBlock("item");
            const minus = app.current.workspace.newBlock("arithmetics");
            const one = app.current.workspace.newBlock("math_number");
            const letter = await this.input(data.inputs.LETTER);
            const string = await this.input(data.inputs.STRING);

            minus.setFieldValue("-", "OP");
            one.setFieldValue("1", "NUM");
            minus.getInput("A")?.connection?.connect(letter!.outputConnection!);
            minus.getInput("B")?.connection?.connect(one.outputConnection!);

            block.getInput("INDEX")?.connection?.connect(minus.outputConnection!);
            block.getInput("ITERABLE")?.connection?.connect(string!.outputConnection!);

            return block;
        };

        this.transformers.operator_length = this.override({
            opcode: "length",
            inputs: {
                STRING: ["ITERABLE"]
            }
        });

        this.transformers.operator_mod = this.operator("arithmetics", "%");
        this.transformers.operator_round = async data => {
            const block = app.current.workspace.newBlock("math");
            block.setFieldValue("round", "OP");
            const value = await this.input(data.inputs.NUM);
            block.getInput("NUM")?.connection?.connect(value!.outputConnection!);
            return block;
        };
        this.transformers.operator_mathop = async data => {
            switch (data.fields.OPERATOR[0]) {
                case "abs":
                case "floor":
                case "sqrt":
                case "sin":
                case "cos":
                case "tan":
                case "asin":
                case "acos":
                case "atan": {
                    const block = app.current.workspace.newBlock("math");
                    block.setFieldValue(data.fields.OPERATOR[0], "OP");
                    const value = await this.input(data.inputs.NUM);
                    block.getInput("NUM")?.connection?.connect(value!.outputConnection!);
                    return block;
                }
                case "ceiling": {
                    const block = app.current.workspace.newBlock("math");
                    block.setFieldValue("ceil", "OP");
                    const value = await this.input(data.inputs.NUM);
                    block.getInput("NUM")?.connection?.connect(value!.outputConnection!);
                    return block;
                }
                case "ln": {
                    const block = app.current.workspace.newBlock("math");
                    block.setFieldValue("log", "OP");
                    const value = await this.input(data.inputs.NUM);
                    block.getInput("NUM")?.connection?.connect(value!.outputConnection!);
                    return block;
                }
                case "log": {
                    const block = app.current.workspace.newBlock("math");
                    block.setFieldValue("log10", "OP");
                    const value = await this.input(data.inputs.NUM);
                    block.getInput("NUM")?.connection?.connect(value!.outputConnection!);
                    return block;
                }
                case "e ^": {
                    const block = app.current.workspace.newBlock("math");
                    block.setFieldValue("exp", "OP");
                    const value = await this.input(data.inputs.NUM);
                    block.getInput("NUM")?.connection?.connect(value!.outputConnection!);
                    return block;
                }
                case "10 ^": {
                    const block = app.current.workspace.newBlock("arithmetics");
                    block.setFieldValue("**", "OP");
                    const value = await this.input(data.inputs.NUM);
                    const ten = app.current.workspace.newBlock("math_number");
                    ten.setFieldValue("10", "NUM");
                    block.getInput("A")?.connection?.connect(ten.outputConnection!);
                    block.getInput("B")?.connection?.connect(value!.outputConnection!);
                    return block;
                }
                default:
                    return this.unknown(`operator_mathop [${data.fields.OPERATOR[0]}]`, "reporter");
            }
        };
        this.transformers.operator_join = async data => {
            const block = app.current.workspace.newBlock("arithmetics");
            const A = await this.input(data.inputs.STRING1);
            const B = await this.input(data.inputs.STRING2);
            block.getInput("A")?.connection?.connect(A!.outputConnection!);
            block.getInput("B")?.connection?.connect(B!.outputConnection!);

            return block;
        };

        // Variables
        this.transformers.data_setvariableto = this.transformers.data_changevariableby = async data => {
            const block = app.current.workspace.newBlock(data.opcode.slice(5, -10));
            const value = await this.input(data.inputs.VALUE);
            block.getInput("VALUE")?.connection?.connect(value!.outputConnection!);

            const variable = app.current.workspace.newBlock("parameter");
            variable.loadExtraState!({isVariable: true});
            variable.setFieldValue(data.fields.VARIABLE[0], "VAR");

            block.getInput("VAR")?.connection?.connect(variable.outputConnection!);

            return block;
        };
        this.transformers.data_showvariable = data => {
            const block = app.current.workspace.newBlock("showVariable");
            block.setFieldValue(data.fields.VARIABLE[0], "VAR");
            return block;
        };
        this.transformers.data_hidevariable = data => {
            const block = app.current.workspace.newBlock("hideVariable");
            block.setFieldValue(data.fields.VARIABLE[0], "VAR");
            return block;
        };

        // Functions
        this.transformers.procedures_definition = def => {
            const data = this.target.blocks[def.inputs.custom_block[1] as string];
            const name = data.mutation!.proccode.replace(/%[bns]/g, "()").trim();
            const block = app.current.workspace.newBlock("function");
            const paramNames: string[] = JSON.parse(data.mutation!.argumentnames);
            const paramTypes = (data.mutation!.proccode.match(/%[bns]/g) ?? []).map(e => (
                e[1] === "s" ? ["string", "number"] : e[1] === "b" ? "boolean" : "number"
            ));

            block.loadExtraState!({
                name: escape(name),
                returnType: "",
                params: paramNames.map((name, i) => ({
                    name: escape(name),
                    type: paramTypes[i]
                }))
            });

            return block;
        };
        this.transformers.procedures_call = async data => {
            const name = data.mutation!.proccode.replace(/%[nbs]/g, "()").trim();
            const call = app.current.workspace.newBlock("call");
            const types = (data.mutation!.proccode.match(/%[bns]/g) ?? []).map(e => ({
                type: e[1] === "s" ? ["string", "number"] : e[1] === "b" ? "boolean" : "number"
            }));
            const args: string[] = JSON.parse(data.mutation!.argumentids);

            call.loadExtraState!({
                name,
                params: types,
            });

            for (let i = 0; i < args.length; i++) {
                const content = data.inputs[args[i]];
                if (content) { // Boolean inputs can be empty
                    const value = await this.input(content);
                    call.getInput(`PARAM_${i}`)?.connection?.connect(value!.outputConnection!);
                }
            }

            return call;
        };
        this.transformers.argument_reporter_string_number = data => {
            const block = app.current.workspace.newBlock("parameter");
            block.setFieldValue(escape(data.fields.VALUE[0]), "VAR");
            return block;
        };
        this.transformers.argument_reporter_boolean = data => {
            const block = app.current.workspace.newBlock("parameter");
            block.loadExtraState!({type: "boolean"});
            block.setFieldValue(escape(data.fields.VALUE[0]), "VAR");
            return block;
        };
    }

    operator(type: "compare" | "arithmetics" | "operation", operator: string) {
        const input = type === "arithmetics" ? "NUM" : "OPERAND";
        return async (data: SB3.Block) => {
            const block = app.current.workspace.newBlock(type);
            block.setFieldValue(operator, "OP");

            const A = await this.input(data.inputs[`${input}1`]);
            const B = await this.input(data.inputs[`${input}2`]);

            block.getInput("A")?.connection?.connect(A!.outputConnection!);
            block.getInput("B")?.connection?.connect(B!.outputConnection!);

            return block;
        };
    }

    async transform(file: File) {
        const zip = await JSZip.loadAsync(file);
        const project: SB3.Project = JSON.parse(await zip.file("project.json")!.async("text"));
        this.isProjectCompatible(project);
        this.assetMap = {};

        for (const target of project.targets) {
            this.isTargetCompatible(target);
            app.current = target.isStage
                ? new Stage()
                : new Sprite(target.name);
            this.target = target;
            app.current.costumes = [];
            for (const costume of target.costumes) {
                const filename = `${costume.assetId}.${costume.dataFormat}`;
                const name = costume.name
                    .replace(illegalRe, "_")
                    .replace(controlRe, "_")
                    .replace(reservedRe, "_");
                app.current.costumes.push(
                    new File(
                        [await zip.file(filename)!.async("blob")],
                        `${this.assetMap[costume.name] = name}.${costume.dataFormat}`,
                        {type: `image/${costume.dataFormat}${costume.dataFormat === "svg" ? "+xml" : ""}`}
                    )
                );
            }
            app.current.update();
            app.current.sounds = [];
            for (const sound of target.sounds) {
                const filename = `${sound.assetId}.${sound.dataFormat}`;
                app.current.sounds.push(
                    new File(
                        [await zip.file(filename)!.async("blob")],
                        `${sound.name}.${sound.dataFormat}`,
                        {type: `audio/${sound.dataFormat}`}
                    )
                );
            }
            app.current.workspace.clear();
            for (const id in target.variables) {
                app.current.variables.push([target.variables[id][0], "any"]);
            }

            this.provided = {};

            if (target.isStage) {
                app.entities.unshift(app.current);
                app.current.render(app.stagePanel);
            } else {
                app.addSprite(app.current as Sprite, false);
            }

            for (const block of Object.values(target.blocks)) {
                if (block.topLevel) {
                    await this.block(block);
                }
            }
        }
    }

    isProjectCompatible(project: SB3.Project) {
        if (project.extensions.length > 0) {
            if (project.extensions.length === 1 && project.extensions[0] === "pen") {
                return;
            }
            throw "Scrap does not support extensions other than the pen extension.";
        }
    }

    isTargetCompatible(target: SB3.Target) {
        if (Object.keys(target.lists).length) {
            throw "Scrap does not support lists.";
        }
    }

    async input([shadow, data]: SB3.Input, command = false) {
        if (typeof data === "string") {
            const block = await this.block(
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
                const block = app.current.workspace.newBlock("math_number");
                block.setFieldValue(+data[1], "NUM");
                block.setShadow(shadow === 1);
                return block;
            }
            case 9: {
                const block = app.current.workspace.newBlock("color");
                block.setFieldValue(data[1], "COLOR");
                block.setShadow(shadow === 1);
                return block;
            }
            case 10: {
                const block = app.current.workspace.newBlock("text_or_number");
                block.setFieldValue(data[1], "VALUE");
                block.setShadow(shadow === 1);
                return block;
            }
            case 11: {
                const block = app.current.workspace.newBlock("iterables_string");
                block.setFieldValue(data[1], "TEXT");
                block.setShadow(shadow === 1);
                return block;
            }
            case 12: {
                const block = app.current.workspace.newBlock("parameter");
                block.loadExtraState!({isVariable: true});
                block.setFieldValue(data[1], "VAR");
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
        return async (data: SB3.Block) => {
            const block = app.current.workspace.newBlock(opcode ?? data.opcode);

            if (extraState) {
                block.loadExtraState!(extraState);
            }

            for (const [name, input] of Object.entries(data.inputs)) {
                const {connection} = block.getInput(name in inputs ? inputs[name][0] : name)!;
                const inner = await this.input(input, name in inputs ? inputs[name][1] : false);

                if (inner && inner.previousConnection) {
                    connection?.connect(inner.previousConnection);
                } else if (inner && inner.outputConnection) {
                    const didConnect = connection?.connect(inner.outputConnection);

                    // Scratch is not strongly typed, so we need to convert the type
                    if (!didConnect) {
                        switch (connection!.getCheck()![0]) {
                            case "number": {
                                const block = app.current.workspace.newBlock("number");
                                block.getInput("VALUE")?.connection?.connect(inner.outputConnection);

                                connection?.connect(block.outputConnection!);
                                break;
                            }
                            case "string": {
                                const block = app.current.workspace.newBlock("string");
                                block.getInput("VALUE")?.connection?.connect(inner.outputConnection);

                                connection?.connect(block.outputConnection!);
                                break;
                            }
                            case "boolean": {
                                const block = app.current.workspace.newBlock("compare");
                                block.setFieldValue("==", "OP");

                                const trueBlock = app.current.workspace.newBlock("iterables_string");
                                trueBlock.setFieldValue("true", "TEXT");

                                block.getInput("A")?.connection?.connect(trueBlock.outputConnection!);
                                block.getInput("B")?.connection?.connect(inner.outputConnection);

                                connection?.connect(block.outputConnection!);
                                break;
                            }
                        }
                    }
                }
            }
            return block;
        };
    }

    setter(kind: "set" | "change", type: string, input: string) {
        return async (data: SB3.Block) => {
            const block = app.current.workspace.newBlock(kind);
            block.getInput("VAR")?.connection!.setShadowState({type});
            const value = await this.input(data.inputs[input]);

            if (value) {
                block.getInput("VALUE")?.connection?.connect(value.outputConnection!);
            }
            return block;
        };
    }

    reporter(name: string) {
        return () => app.current.workspace.newBlock(name);
    }

    async block(data: SB3.Block, isInput?: boolean) {
        if (data.opcode in this.transformers) {
            var block = await this.transformers[data.opcode](data);
        } else {
            var block = await this.unknown(data.opcode, isInput ? "reporter" : "command");
        }

        if (data.next) {
            const next = await this.block(this.target.blocks[data.next]);
            block.nextConnection?.connect(next.previousConnection!);
        }

        return new Promise<Blockly.Block>(resolve => {
            setTimeout(() => {
                resolve(block);
            });
        });
    }

    unknown(opcode: string, shape: "reporter" | "command") {
        const block = app.current.workspace.newBlock("unknown");
        block.loadExtraState!({shape, opcode});

        return new Promise<Blockly.Block>(resolve => {
            setTimeout(() => {
                resolve(block);
            });
        });
    }

    /**
     * Some Scratch blocks do not have a corresponding block in Scrap.
     * However, it is sometimes possible to emulate the block using a function.
     * This is a helper function to create a function that can be used to emulate a block.
     */
    provide(_block: Blockly.Block, init: SB3.Provide) {
        if (init.name in this.provided) {
            _block.dispose(false);
            return this.provided[init.name];
        }

        const name = `scratch_${init.name}_${Date.now().toString(36)}`;
        let block = app.current.workspace.newBlock("function");
        block.setCommentText(init.comment);
        
        block.loadExtraState!({
            name,
            params: init.args,
            returnType: init.returns
        });

        block.nextConnection?.connect(_block.previousConnection!);
        return this.provided[init.name] = name;
    }

    /**
     * Sometimes, user wants to know costume or backdrop name.
     * However, Scrap renames the assets to a valid filename.
     * @param type The type of asset to provide.
     * @returns Call block that calls the provided function.
     */
    asset(type: string) {
        return (data: SB3.Block) => {
            if (data.fields.NUMBER_NAME[0] === "number") { // Scratch uses 1-based indexing
                const one = app.current.workspace.newBlock("math_number");
                one.setFieldValue("1", "NUM");

                const add = app.current.workspace.newBlock("arithmetics");
                add.setFieldValue("+", "OP");

                const block = app.current.workspace.newBlock(type);
                block.setFieldValue("index", "VALUE");

                add.getInput("A")?.connection?.connect(one.outputConnection!);
                add.getInput("B")?.connection?.connect(block.outputConnection!);

                return add;
            }

            const block = app.current.workspace.newBlock("controls_if");
            block.loadExtraState!({
                hasElse: true,
                elseIfCount: this.target.costumes.length - 1
            });

            for (let i = 0; i < this.target.costumes.length; i++) {
                const equals = app.current.workspace.newBlock("compare");
                equals.setFieldValue("==", "OP");

                const assetBlock = app.current.workspace.newBlock(type);
                const nameBlock = app.current.workspace.newBlock("iterables_string");

                nameBlock.setFieldValue(this.assetMap[this.target.costumes[i].name], "TEXT");
                equals.getInput("A")?.connection?.connect(assetBlock.outputConnection!);
                equals.getInput("B")?.connection?.connect(nameBlock.outputConnection!);

                block.getInput(`IF${i}`)?.connection?.connect(equals.outputConnection!);

                const returnBlock = app.current.workspace.newBlock("return");
                returnBlock.loadExtraState!({
                    output: "string"
                });

                returnBlock.getInput("VALUE")?.connection!.targetBlock()!.setFieldValue(this.target.costumes[i].name, "TEXT");
                block.getInput(`DO${i}`)?.connection?.connect(returnBlock.previousConnection!);
            }

            const throwBlock = app.current.workspace.newBlock("throw");
            throwBlock.getInput("ERROR")?.connection!.setShadowState({
                type: "iterables_string",
                fields: {
                    TEXT: "Invalid costume name"
                }
            });
            block.getInput("ELSE")?.connection?.connect(throwBlock.previousConnection!);

            const name = this.provide(block, {
                args: [],
                name: type,
                returns: "string",
                comment: "Returns the name of the asset before renaming."
            });

            const call = app.current.workspace.newBlock("call");
            call.loadExtraState!({
                name,
                params: [],
                returnType: "string"
            });

            return call;
        };
    }
}

interface SB3 {
    target: SB3.Target;
    provided: Record<string, string>;
    assetMap: Record<string, string>;
}

declare namespace SB3 {
    interface Override {
        opcode?: string;
        inputs?: Record<string, [string, boolean?]>;
        extraState?: unknown;
    }

    interface Provide {
        comment: string;
        returns: string;
        args: {
            name: string;
            type: string;
        }[];
        name: string;
    }

    type Variable = [string, string | number, true?];
    type Input = [1 | 2, string | SimpleBlock | null];
    type Field = [string, string | null];

    type SimpleBlock =
        | [4, `${number}`]
        | [5, `${number}`]
        | [6, `${number}`]
        | [7, `${number}`]
        | [8, `${number}`]
        | [9, `#${string}`]
        | [10, string]
        | [11, string, string]
        | [12, string, string]
        | [13, string, string]
        ;

    interface Mutation {
        tagName: "mutation";
        children: [];
        proccode: string;
        argumentids: string;
        argumentnames: string;
        argumentdefaults: string;
        warp: `${boolean}`;
    }

    interface Block {
        opcode: string;
        next: string | null;
        parent: string | null;
        inputs: Record<string, Input>;
        fields: Record<string, Field>;
        shadow: boolean;
        topLevel: boolean;
        mutation?: Mutation;
    }

    interface Costume {
        name: string;
        dataFormat: "png" | "svg" | "jpg" | "bmp" | "gif";
        assetId: string;
    }

    interface Sound {
        name: string;
        dataFormat: "wav" | "mp3" | "m4a" | "ogg";
        assetId: string;
    }

    interface Target {
        name: string;
        variables: Record<string, Variable>;
        lists: Record<string, unknown>;
        costumes: Costume[];
        currentCostume: number;
        sounds: Sound[];
        blocks: Record<string, Block>;
    }

    interface Stage extends Target {
        name: "Stage";
        isStage: true;
    }

    interface Sprite extends Target {
        isStage: false;
    }

    interface Project {
        targets: (Stage | Sprite)[];
        extensions: string[];
    }
}

export default SB3;