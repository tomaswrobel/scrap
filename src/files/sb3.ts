import JSZip from "jszip";
import {Sprite, Stage} from "../entities";
import * as Blockly from "blockly/core";

const illegalRe = /[\/\?<>\\:\*\|":#]+/g;
const controlRe = /[\x00-\x1f\x80-\x9f]/g;
const reservedRe = /^\.+$/;

class SB3 {
    target!: SB3.Target;
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
        this.transformers.motion_setrotationstyle = data => {
            const block = window.app.current.codeWorkspace.newBlock("setRotationStyle");
            const value = window.app.current.codeWorkspace.newBlock("rotationStyle");

            value.setFieldValue(data.fields.STYLE[0], "STYLE");
            value.setShadow(true);

            block.getInput("STYLE")!.connection!.connect(value.outputConnection!);
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
            const effect = this.effect(data);

            if (!effect) {
                return this.unknown(`${data.opcode} [${data.fields.EFFECT[0]}]`, "command");
            }

            const value = await this.input(data.inputs.VALUE);

            const block = window.app.current.codeWorkspace.newBlock(data.opcode === "looks_seteffectto" ? "setEffect" : "changeEffect");
            block.getInput("EFFECT")!.connection!.connect(effect);
            block.getInput("CHANGE")!.connection!.connect(value!.outputConnection!);

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
        this.transformers.looks_costume = data => {
            const block = window.app.current.codeWorkspace.newBlock("costume_menu");
            block.setFieldValue(this.assetMap[data.fields.COSTUME[0]], "NAME");
            return block;
        };
        this.transformers.looks_backdrops = data => {
            const block = window.app.current.codeWorkspace.newBlock("backdrop_menu");
            block.setFieldValue(this.assetMap[data.fields.BACKDROP[0]], "NAME");
            return block;
        };
        this.transformers.looks_switchcostumeto = async data => {
            const block = window.app.current.codeWorkspace.newBlock("switchCostumeTo");
            const input = await this.input(data.inputs.COSTUME);

            if (input!.outputConnection!.getCheck()![0] === "Number") {
                const one = window.app.current.codeWorkspace.newBlock("math_number");
                one.setFieldValue("1", "NUM");

                const subtract = window.app.current.codeWorkspace.newBlock("arithmetics");
                subtract.setFieldValue("-", "OP");

                subtract.getInput("A")!.connection!.connect(input!.outputConnection!);
                subtract.getInput("B")!.connection!.connect(one.outputConnection!);

                block.getInput("COSTUME")!.connection!.connect(subtract.outputConnection!);
            } else {
                block.getInput("COSTUME")!.connection!.connect(input!.outputConnection!);
            }

            return block;
        };
        this.transformers.looks_nextcostume = this.override({
            opcode: "nextCostume",
        });
        this.transformers.looks_switchbackdropto = async data => {
            const block = window.app.current.codeWorkspace.newBlock("switchBackdropTo");
            const input = await this.input(data.inputs.BACKDROP);

            if (input!.outputConnection!.getCheck()![0] === "Number") {
                const one = window.app.current.codeWorkspace.newBlock("math_number");
                one.setFieldValue("1", "NUM");

                const subtract = window.app.current.codeWorkspace.newBlock("arithmetics");
                subtract.setFieldValue("-", "OP");

                subtract.getInput("A")!.connection!.connect(input!.outputConnection!);
                subtract.getInput("B")!.connection!.connect(one.outputConnection!);

                block.getInput("COSTUME")!.connection!.connect(subtract.outputConnection!);
            } else {
                block.getInput("COSTUME")!.connection!.connect(input!.outputConnection!);
            }

            return block;
        };
        this.transformers.looks_switchbackdroptoandwait = this.override({
            opcode: "switchBackdropToWait"
        });
        this.transformers.looks_gotofrontback = data => {
            return data.fields.FRONT_BACK[0] === "front"
                ? window.app.current.codeWorkspace.newBlock("goToFront")
                : window.app.current.codeWorkspace.newBlock("goToBack")
                ;
        };
        this.transformers.looks_goforwardbackwardlayers = data => {
            return data.fields.FORWARD_BACKWARD[0] === "forward"
                ? window.app.current.codeWorkspace.newBlock("goForward")
                : window.app.current.codeWorkspace.newBlock("goBackward")
                ;
        };
        this.transformers.looks_costumenumbername = data => {
            if (data.fields.NUMBER_NAME[0] === "number") { // Scratch uses 1-based indexing
                const one = window.app.current.codeWorkspace.newBlock("math_number");
                one.setFieldValue("1", "NUM");

                const add = window.app.current.codeWorkspace.newBlock("arithmetics");
                add.setFieldValue("+", "OP");

                const block = window.app.current.codeWorkspace.newBlock("costumeNumber");

                add.getInput("A")!.connection!.connect(one.outputConnection!);
                add.getInput("B")!.connection!.connect(block.outputConnection!);

                return add;
            }
            return this.provideAsset("costumeName");
        };
        this.transformers.looks_backdropnumbername = data => {
            if (data.fields.NUMBER_NAME[0] === "number") { // Scratch uses 1-based indexing
                const one = window.app.current.codeWorkspace.newBlock("math_number");
                one.setFieldValue("1", "NUM");

                const add = window.app.current.codeWorkspace.newBlock("arithmetics");
                add.setFieldValue("+", "OP");

                const block = window.app.current.codeWorkspace.newBlock("backdropNumber");

                add.getInput("A")!.connection!.connect(one.outputConnection!);
                add.getInput("B")!.connection!.connect(block.outputConnection!);

                return add;
            }

            return this.provideAsset("backdropName");
        };
        this.transformers.looks_nextbackdrop = this.override({
            opcode: "nextBackdrop",
        });

        // Sounds
        this.transformers.sound_sounds_menu = data => {
            const block = window.app.current.codeWorkspace.newBlock("sound");
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
        this.transformers.event_whengreaterthan = async data => {
            if (data.fields.WHENGREATERTHANMENU[0] === "TIMER") {
                const block = window.app.current.codeWorkspace.newBlock("whenTimerElapsed");
                const value = await this.input(data.inputs.VALUE);
                block.getInput("TIMER")!.connection!.connect(value!.outputConnection!);
                return block;
            } else {
                return this.unknown("event_whengreaterthan [volume]", "command");
            }
        };
        this.transformers.event_whenthisspriteclicked = () => {
            const block = window.app.current.codeWorkspace.newBlock("whenMouse");
            const event = window.app.current.codeWorkspace.newBlock("event");

            event.setShadow(true);
            block.getInput("EVENT")!.connection!.connect(event.outputConnection!);

            return block;
        };
        this.transformers.event_whenstageclicked = this.transformers.event_whenthisspriteclicked;
        this.transformers.event_whenbroadcastreceived = data => {
            const block = window.app.current.codeWorkspace.newBlock("whenReceiveMessage");
            const message = window.app.current.codeWorkspace.newBlock("iterables_string");
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
        this.transformers.event_whenbackdropswitchesto = data => {
            const block = window.app.current.codeWorkspace.newBlock("whenBackdropChangesTo");
            const backdrop = window.app.current.codeWorkspace.newBlock("backdrop_menu");
            backdrop.setFieldValue(this.assetMap[data.fields.BACKDROP[0]], "NAME");
            backdrop.setShadow(true);
            block.getInput("BACKDROP")!.connection!.connect(backdrop.outputConnection!);
            return block;
        };
        this.transformers.event_whenkeypressed = data => {
            const key = window.app.current.codeWorkspace.newBlock("key");

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

            const block = window.app.current.codeWorkspace.newBlock("whenKeyPressed");
            block.getInput("KEY")!.connection!.connect(key.outputConnection!);
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
            const block = window.app.current.codeWorkspace.newBlock("while");
            const not = window.app.current.codeWorkspace.newBlock("not");

            const condition = await this.input(data.inputs.CONDITION);
            if (condition) {
                not.getInput("BOOL")!.connection!.connect(condition.outputConnection!);
            }

            block.getInput("CONDITION")!.connection!.connect(not.outputConnection!);

            if ("SUBSTACK" in data.inputs) {
                const inner = await this.input(data.inputs.SUBSTACK, true);
                block.getInput("STACK")!.connection!.connect(inner!.previousConnection!);
            }

            return block;
        };
        this.transformers.control_wait_until = this.transformers.control_repeat_until;
        this.transformers.control_stop = data => {
            const options = data.fields.STOP_OPTION[0];

            if (options === "all") {
                return window.app.current.codeWorkspace.newBlock("stop");
            } else if (options === "this script") {
                return window.app.current.codeWorkspace.newBlock("return");
            } else {
                return this.unknown(`control_stop [${options}]`, "command");
            }
        };
        this.transformers.control_repeat = this.override({
            opcode: "repeat",
            inputs: {
                SUBSTACK: ["STACK", true]
            }
        });
        this.transformers.control_start_as_clone = this.override({
            opcode: "whenCloned"
        });
        this.transformers.control_create_clone_of = data => {
            const field = this.target.blocks[data.inputs.CLONE_OPTION[1] as string].fields.CLONE_OPTION[0];
            const block = window.app.current.codeWorkspace.newBlock("clone");
            const sprite = window.app.current.codeWorkspace.newBlock("sprite");

            sprite.setShadow(true);
            if (field !== "_myself_") {
                sprite.setFieldValue(field, "SPRITE");
            } else {
                sprite.setFieldValue("this", "SPRITE");
            }

            block.getInput("SPRITE")!.connection!.connect(sprite.outputConnection!);

            return block;
        };
        this.transformers.control_delete_this_clone = () => (
            window.app.current.codeWorkspace.newBlock("delete")
        );
        this.transformers.control_forever = async data => {
            const block = window.app.current.codeWorkspace.newBlock("while");

            if ("SUBSTACK" in data.inputs) {
                const inner = await this.input(data.inputs.SUBSTACK, true);
                block.getInput("STACK")!.connection!.connect(
                    inner!.previousConnection!
                );
            }

            const trueBlock = window.app.current.codeWorkspace.newBlock("boolean");
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
        this.transformers.sensing_of = async data => {
            const fieldValue = this.target.blocks[data.inputs.OBJECT[1] as string].fields.OBJECT[0];

            if (fieldValue === "_stage_") {
                return this.unknown("sensing_of [_stage_]", "reporter");
            }

            const block = window.app.current.codeWorkspace.newBlock("property");

            switch (data.fields.PROPERTY[0]) {
                case "x position":
                    block.setFieldValue("x", "PROPERTY");
                    break;
                case "y position":
                    block.setFieldValue("y", "PROPERTY");
                    break;
                case "direction":
                case "size":
                case "volume":
                    block.setFieldValue(data.fields.PROPERTY[0], "PROPERTY");
                    break;
                default:
                    block.dispose(false);
                    return this.unknown(`sensing_of [${data.fields.PROPERTY[0]}]`, "reporter");
            }

            return block;
        };
        this.transformers.sensing_touchingobject = data => {
            const fieldValue = this.target.blocks[data.inputs.TOUCHINGOBJECTMENU[1] as string].fields.TOUCHINGOBJECTMENU[0];

            if (fieldValue === "_edge_") {
                return window.app.current.codeWorkspace.newBlock("isTouchingEdge");
            } else if (fieldValue === "_mouse_") {
                return window.app.current.codeWorkspace.newBlock("isTouchingMouse");
            } else {
                const block = window.app.current.codeWorkspace.newBlock("isTouching");
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
            const block = window.app.current.codeWorkspace.newBlock("distanceTo");
            if (fieldValue === "_mouse_") {
                block.getInput("X")!.connection!.connect(
                    window.app.current.codeWorkspace.newBlock("mouseX")!.outputConnection!
                );
                block.getInput("Y")!.connection!.connect(
                    window.app.current.codeWorkspace.newBlock("mouseY")!.outputConnection!
                );
            } else {
                const x = window.app.current.codeWorkspace.newBlock("property");
                x.setFieldValue("x", "PROPERTY");
                x.getInput("SPRITE")!.connection!.connect(this.setSprite(fieldValue));

                const y = window.app.current.codeWorkspace.newBlock("property");
                y.setFieldValue("y", "PROPERTY");
                y.getInput("SPRITE")!.connection!.connect(this.setSprite(fieldValue));

                block.getInput("X")!.connection!.connect(x.outputConnection!);
                block.getInput("Y")!.connection!.connect(y.outputConnection!);
            }
            return block;
        };
        this.transformers.sensing_askandwait = async data => {
            const name = this.helperVariable("answer", "String");
            const block = window.app.current.codeWorkspace.newBlock("setVariable");
            block.setFieldValue(name, "VAR");
            const ask = window.app.current.codeWorkspace.newBlock("ask");
            const question = await this.input(data.inputs.QUESTION);
            ask.getInput("QUESTION")!.connection!.connect(question!.outputConnection!);
            block.getInput("VALUE")!.connection!.connect(ask.outputConnection!);
            return block;
        };
        this.transformers.sensing_answer = () => {
            const name = this.helperVariable("answer", "String");
            const block = window.app.current.codeWorkspace.newBlock("parameter");
            block.loadExtraState!({type: "String"});
            block.setFieldValue(name, "VAR");
            return block;
        };
        this.transformers.sensing_keyoptions = data => {
            const block = window.app.current.codeWorkspace.newBlock("key");

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
            const block = window.app.current.codeWorkspace.newBlock("setDragMode");
            if (data.fields.DRAG_MODE[0] === "draggable") {
                const trueBlock = window.app.current.codeWorkspace.newBlock("boolean");
                trueBlock.setFieldValue("true", "BOOL");
                block.getInput("DRAGGABLE")!.connection!.connect(trueBlock.outputConnection!);
            } else if (data.fields.DRAG_MODE[0] === "not draggable") {
                const falseBlock = window.app.current.codeWorkspace.newBlock("boolean");
                falseBlock.setFieldValue("false", "BOOL");
                block.getInput("DRAGGABLE")!.connection!.connect(falseBlock.outputConnection!);
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
            const fromParam = window.app.current.codeWorkspace.newBlock("parameter");
            fromParam.loadExtraState!({type: "Number"});
            fromParam.setFieldValue("__from__", "VAR");

            const toParam = window.app.current.codeWorkspace.newBlock("parameter");
            toParam.loadExtraState!({type: "Number"});
            toParam.setFieldValue("__to__", "VAR");

            const multiply = window.app.current.codeWorkspace.newBlock("arithmetics");
            multiply.setFieldValue("*", "OP");

            const add = window.app.current.codeWorkspace.newBlock("arithmetics");
            add.setFieldValue("+", "OP");

            const subtract = window.app.current.codeWorkspace.newBlock("arithmetics");
            subtract.setFieldValue("-", "OP");

            const floor = window.app.current.codeWorkspace.newBlock("math");
            floor.setFieldValue("floor", "OP");

            const one = window.app.current.codeWorkspace.newBlock("math_number");
            one.setFieldValue("1", "NUM");

            const returnBlock = window.app.current.codeWorkspace.newBlock("return");
            returnBlock.loadExtraState!({output: "Number"});

            const random = window.app.current.codeWorkspace.newBlock("random");

            // Connections
            multiply.getInput("A")!.connection!.connect(random.outputConnection!);
            multiply.getInput("B")!.connection!.connect(subtract.outputConnection!);
            subtract.getInput("A")!.connection!.connect(toParam.outputConnection!);
            subtract.getInput("B")!.connection!.connect(fromParam.outputConnection!);

            floor.getInput("NUM")!.connection!.connect(multiply.outputConnection!);
            add.getInput("A")!.connection!.connect(floor.outputConnection!);
            add.getInput("B")!.connection!.connect(one.outputConnection!);

            const name = this.provide(returnBlock, {
                args: [
                    {
                        name: "__from__",
                        type: "Number"
                    },
                    {
                        name: "__to__",
                        type: "Number"
                    }
                ],
                name: "random",
                returns: "Number",
                comment: "Returns a random number between\n__from__ and __to__ inclusive.\n(JavaScript does not have such a function.)"
            });

            if (returnBlock.disposed) {
                add.dispose(false);
            } else {
                returnBlock.getInput("VALUE")!.connection!.connect(add.outputConnection!);
            }

            const block = window.app.current.codeWorkspace.newBlock("call");
            block.loadExtraState!({
                name,
                params: [
                    "Number",
                    "Number"
                ],
                returnType: "Number"
            });

            const from = await this.input(data.inputs.FROM);
            const to = await this.input(data.inputs.TO);

            block.getInput("PARAM_0")!.connection!.connect(from!.outputConnection!);
            block.getInput("PARAM_1")!.connection!.connect(to!.outputConnection!);

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
            const block = window.app.current.codeWorkspace.newBlock("item");
            const minus = window.app.current.codeWorkspace.newBlock("arithmetics");
            const one = window.app.current.codeWorkspace.newBlock("math_number");
            const letter = await this.input(data.inputs.LETTER);
            const string = await this.input(data.inputs.STRING);

            minus.setFieldValue("-", "OP");
            one.setFieldValue("1", "NUM");
            minus.getInput("A")!.connection!.connect(letter!.outputConnection!);
            minus.getInput("B")!.connection!.connect(one.outputConnection!);

            block.getInput("INDEX")!.connection!.connect(minus.outputConnection!);
            block.getInput("ITERABLE")!.connection!.connect(string!.outputConnection!);

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
            const block = window.app.current.codeWorkspace.newBlock("math");
            block.setFieldValue("round", "OP");
            const value = await this.input(data.inputs.NUM);
            block.getInput("NUM")!.connection!.connect(value!.outputConnection!);
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
                    const block = window.app.current.codeWorkspace.newBlock("math");
                    block.setFieldValue(data.fields.OPERATOR[0], "OP");
                    const value = await this.input(data.inputs.NUM);
                    block.getInput("NUM")!.connection!.connect(value!.outputConnection!);
                    return block;
                }
                case "ceiling": {
                    const block = window.app.current.codeWorkspace.newBlock("math");
                    block.setFieldValue("ceil", "OP");
                    const value = await this.input(data.inputs.NUM);
                    block.getInput("NUM")!.connection!.connect(value!.outputConnection!);
                    return block;
                }
                case "ln": {
                    const block = window.app.current.codeWorkspace.newBlock("math");
                    block.setFieldValue("log", "OP");
                    const value = await this.input(data.inputs.NUM);
                    block.getInput("NUM")!.connection!.connect(value!.outputConnection!);
                    return block;
                }
                case "log": {
                    const block = window.app.current.codeWorkspace.newBlock("math");
                    block.setFieldValue("log10", "OP");
                    const value = await this.input(data.inputs.NUM);
                    block.getInput("NUM")!.connection!.connect(value!.outputConnection!);
                    return block;
                }
                case "e ^": {
                    const block = window.app.current.codeWorkspace.newBlock("math");
                    block.setFieldValue("exp", "OP");
                    const value = await this.input(data.inputs.NUM);
                    block.getInput("NUM")!.connection!.connect(value!.outputConnection!);
                    return block;
                }
                case "10 ^": {
                    const block = window.app.current.codeWorkspace.newBlock("arithmetics");
                    block.setFieldValue("**", "OP");
                    const value = await this.input(data.inputs.NUM);
                    const ten = window.app.current.codeWorkspace.newBlock("math_number");
                    ten.setFieldValue("10", "NUM");
                    block.getInput("A")!.connection!.connect(ten.outputConnection!);
                    block.getInput("B")!.connection!.connect(value!.outputConnection!);
                    return block;
                }
                default:
                    return this.unknown(`operator_mathop [${data.fields.OPERATOR[0]}]`, "reporter");
            }
        };
        this.transformers.operator_join = async data => {
            const block = window.app.current.codeWorkspace.newBlock("join");
            const array = window.app.current.codeWorkspace.newBlock("array");

            array.loadExtraState!({
                items: ["single", "single"]
            });

            const A = await this.input(data.inputs.STRING1);
            const B = await this.input(data.inputs.STRING2);
            array.getInput("ADD0")!.connection!.connect(A!.outputConnection!);
            array.getInput("ADD1")!.connection!.connect(B!.outputConnection!);

            const string = window.app.current.codeWorkspace.newBlock("iterables_string");
            string.setFieldValue("", "TEXT");

            block.getInput("SEPARATOR")!.connection!.connect(string.outputConnection!);
            block.getInput("ITERABLE")!.connection!.connect(array.outputConnection!);

            return block;
        };

        // Variables
        this.transformers.data_setvariableto = async data => {
            const block = window.app.current.codeWorkspace.newBlock("setVariable");
            const value = await this.input(data.inputs.VALUE);
            block.getInput("VALUE")!.connection!.connect(value!.outputConnection!);
            block.setFieldValue(data.fields.VARIABLE[0], "VAR");
            return block;
        };
        this.transformers.data_changevariableby = async data => {
            const block = window.app.current.codeWorkspace.newBlock("changeVariable");
            const value = await this.input(data.inputs.VALUE);
            block.getInput("VALUE")!.connection!.connect(value!.outputConnection!);
            block.setFieldValue(data.fields.VARIABLE[0], "VAR");
            return block;
        };
        this.transformers.data_showvariable = data => {
            const block = window.app.current.codeWorkspace.newBlock("showVariable");
            block.setFieldValue(data.fields.VARIABLE[0], "VAR");
            return block;
        };
        this.transformers.data_hidevariable = data => {
            const block = window.app.current.codeWorkspace.newBlock("hideVariable");
            block.setFieldValue(data.fields.VARIABLE[0], "VAR");
            return block;
        };

        // Functions
        this.transformers.procedures_definition = def => {
            const data = this.target.blocks[def.inputs.custom_block[1] as string];
            const name = data.mutation!.proccode.replace(/%[bns]/g, "()").trim();
            const block = window.app.current.codeWorkspace.newBlock("function");
            const paramNames: string[] = JSON.parse(data.mutation!.argumentnames);
            const paramTypes = (data.mutation!.proccode.match(/%[bns]/g) ?? []).map(e => (
                e[1] === "s" ? ["String", "Number"] : e[1] === "b" ? "Boolean" : "Number"
            ));

            block.loadExtraState!({
                name,
                returnType: "",
                params: paramNames.map((name, i) => ({
                    name,
                    type: paramTypes[i]
                }))
            });

            return block;
        };
        this.transformers.procedures_call = async data => {
            const name = data.mutation!.proccode.replace(/%[nbs]/g, "()").trim();
            const call = window.app.current.codeWorkspace.newBlock("call");
            const types = (data.mutation!.proccode.match(/%[bns]/g) ?? []).map(e => ({
                type: e[1] === "s" ? ["String", "Number"] : e[1] === "b" ? "Boolean" : "Number"
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
                    call.getInput(`PARAM_${i}`)!.connection!.connect(value!.outputConnection!);
                }
            }

            return call;
        };
        this.transformers.argument_reporter_string_number = data => {
            const block = window.app.current.codeWorkspace.newBlock("parameter");
            block.setFieldValue(data.fields.VALUE[0], "VAR");
            return block;
        };
        this.transformers.argument_reporter_boolean = data => {
            const block = window.app.current.codeWorkspace.newBlock("parameter");
            block.loadExtraState!({type: "Boolean"});
            block.setFieldValue(data.fields.VALUE[0], "VAR");
            block.setOutput(true, "Boolean");
            return block;
        };
    }

    effect(data: SB3.Block) {
        const block = window.app.current.codeWorkspace.newBlock("effect");

        switch (data.fields.EFFECT[0]) {
            case "color":
                block.setFieldValue("color", "EFFECT");
                break;
            case "ghost":
                block.setFieldValue("ghost", "EFFECT");
                break;
            case "brightness":
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
        return async (data: SB3.Block) => {
            const block = window.app.current.codeWorkspace.newBlock(type);
            block.setFieldValue(operator, "OP");

            const A = await this.input(data.inputs[`${input}1`]);
            const B = await this.input(data.inputs[`${input}2`]);

            block.getInput("A")!.connection!.connect(A!.outputConnection!);
            block.getInput("B")!.connection!.connect(B!.outputConnection!);

            return block;
        };
    }

    assetMap: Record<string, string> = {};

    async transform(file: File) {
        const zip = await JSZip.loadAsync(file);
        const project: SB3.Project = JSON.parse(await zip.file("project.json")!.async("text"));
        this.isProjectCompatible(project);

        for (const target of project.targets) {
            this.isTargetCompatible(target);
            window.app.current = target.isStage
                ? new Stage()
                : new Sprite(target.name);
            this.target = target;
            window.app.current.costumes = [];
            for (const costume of target.costumes) {
                const filename = `${costume.assetId}.${costume.dataFormat}`;
                const name = costume.name
                    .replace(illegalRe, "_")
                    .replace(controlRe, "_")
                    .replace(reservedRe, "_");
                window.app.current.costumes.push(
                    new File(
                        [await zip.file(filename)!.async("blob")],
                        this.assetMap[costume.name] = `${name}.${costume.dataFormat}`,
                        {type: `image/${costume.dataFormat}${costume.dataFormat === "svg" ? "+xml" : ""}`}
                    )
                );
            }
            window.app.current.update();
            window.app.current.sounds = [];
            for (const sound of target.sounds) {
                const filename = `${sound.assetId}.${sound.dataFormat}`;
                window.app.current.sounds.push(
                    new File(
                        [await zip.file(filename)!.async("blob")],
                        `${sound.name}.${sound.dataFormat}`,
                        {type: `audio/${sound.dataFormat}`}
                    )
                );
            }
            window.app.current.codeWorkspace.clear();
            for (const id in target.variables) {
                window.app.current.variables.push([target.variables[id][0], ""]);
            }

            this.provided = {};
            this.helped = {};

            if (target.isStage) {
                window.app.entities.unshift(window.app.current);
                window.app.current.render(window.app.stagePanel);
                await window.app.setGlobalVariables();
            } else {
                window.app.addSprite(window.app.current as Sprite);
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

    private setSprite(name: string) {
        const block = window.app.current.codeWorkspace.newBlock("sprite");
        block.setFieldValue(name, "SPRITE");
        block.setShadow(true);
        return block.outputConnection!;
    }

    private helped!: Record<string, string>;

    private helperVariable(id: string, type: string) {
        if (!(id in this.helped)) {
            const name = Blockly.Variables.generateUniqueNameFromOptions(
                "a",
                window.app.current.variables.map(e => e[0])
            );
            this.helped[id] = name;
            window.app.current.variables.push([name, type]);
        }
        return this.helped[id];
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
                const block = window.app.current.codeWorkspace.newBlock("math_number");
                block.setFieldValue(+data[1], "NUM");
                block.setShadow(shadow === 1);
                return block;
            }
            case 9: {
                const block = window.app.current.codeWorkspace.newBlock("color");
                block.setFieldValue(data[1], "COLOR");
                block.setShadow(shadow === 1);
                return block;
            }
            case 10: {
                const block = window.app.current.codeWorkspace.newBlock("text_or_number");
                block.setFieldValue(data[1], "VALUE");
                block.setShadow(shadow === 1);
                return block;
            }
            case 11: {
                const block = window.app.current.codeWorkspace.newBlock("iterables_string");
                block.setFieldValue(data[1], "TEXT");
                block.setShadow(shadow === 1);
                return block;
            }
            case 12: {
                const block = window.app.current.codeWorkspace.newBlock("parameter");
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
            const block = window.app.current.codeWorkspace.newBlock(opcode ?? data.opcode);

            if (extraState) {
                block.loadExtraState!(extraState);
            }

            for (const [name, input] of Object.entries(data.inputs)) {
                const {connection} = block.getInput(name in inputs ? inputs[name][0] : name)!;
                const inner = await this.input(input, name in inputs ? inputs[name][1] : false);

                if (inner && inner.previousConnection) {
                    connection!.connect(inner.previousConnection);
                } else if (inner && inner.outputConnection) {
                    const didConnect = connection!.connect(inner.outputConnection);

                    // Scratch is not strongly typed, so we need to convert the type
                    if (!didConnect) {
                        switch (connection!.getCheck()![0]) {
                            case "Number": {
                                const block = window.app.current.codeWorkspace.newBlock("number");
                                block.getInput("VALUE")!.connection!.connect(inner.outputConnection);

                                connection!.connect(block.outputConnection!);
                                break;
                            }
                            case "String": {
                                const block = window.app.current.codeWorkspace.newBlock("string");
                                block.getInput("VALUE")!.connection!.connect(inner.outputConnection);

                                connection!.connect(block.outputConnection!);
                                break;
                            }
                            case "Boolean": {
                                const block = window.app.current.codeWorkspace.newBlock("compare");
                                block.setFieldValue("==", "OP");

                                const trueBlock = window.app.current.codeWorkspace.newBlock("iterables_string");
                                trueBlock.setFieldValue("true", "TEXT");

                                block.getInput("A")!.connection!.connect(trueBlock.outputConnection!);
                                block.getInput("B")!.connection!.connect(inner.outputConnection);

                                connection!.connect(block.outputConnection!);
                                break;
                            }
                        }
                    }
                }
            }
            return block;
        };
    }

    reporter(name: string) {
        return () => window.app.current.codeWorkspace.newBlock(name);
    }

    async block(data: SB3.Block, isInput?: boolean) {
        if (data.opcode in this.transformers) {
            var block = await this.transformers[data.opcode](data);
        } else {
            var block = await this.unknown(data.opcode, isInput ? "reporter" : "command");
        }

        if (data.next) {
            const next = await this.block(this.target.blocks[data.next]);
            block.nextConnection!.connect(next.previousConnection!);
        }

        return new Promise<Blockly.Block>(resolve => {
            setTimeout(() => {
                resolve(block);
            });
        });
    }

    unknown(opcode: string, shape: "reporter" | "command") {
        const block = window.app.current.codeWorkspace.newBlock("unknown");
        block.loadExtraState!({shape, opcode});

        return new Promise<Blockly.Block>(resolve => {
            setTimeout(() => {
                resolve(block);
            });
        });
    }

    provided!: Record<string, string>;
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
        let block = window.app.current.codeWorkspace.newBlock("function");

        block.loadExtraState!({
            name,
            params: init.args,
            returnType: init.returns
        });

        block.nextConnection!.connect(_block.previousConnection!);
        return this.provided[init.name] = name;
    }

    /**
     * Sometimes, user wants to know costume or backdrop name.
     * However, Scrap renames the assets to a valid filename.
     * @param type The type of asset to provide.
     * @returns Call block that calls the provided function.
     */
    provideAsset(type: string) {
        const block = window.app.current.codeWorkspace.newBlock("controls_if");
        block.loadExtraState!({
            hasElse: true,
            elseIfCount: this.target.costumes.length - 1
        });

        for (let i = 0; i < this.target.costumes.length; i++) {
            const equals = window.app.current.codeWorkspace.newBlock("compare");
            equals.setFieldValue("==", "OP");

            const assetBlock = window.app.current.codeWorkspace.newBlock(type);
            const nameBlock = window.app.current.codeWorkspace.newBlock("iterables_string");

            nameBlock.setFieldValue(this.assetMap[this.target.costumes[i].name], "TEXT");
            equals.getInput("A")!.connection!.connect(assetBlock.outputConnection!);
            equals.getInput("B")!.connection!.connect(nameBlock.outputConnection!);

            block.getInput(`IF${i}`)!.connection!.connect(equals.outputConnection!);

            const returnBlock = window.app.current.codeWorkspace.newBlock("return");
            returnBlock.loadExtraState!({
                output: "String"
            });

            returnBlock.getInput("VALUE")!.connection!.targetBlock()!.setFieldValue(this.target.costumes[i].name, "TEXT");
            block.getInput(`DO${i}`)!.connection!.connect(returnBlock.previousConnection!);
        }

        const throwBlock = window.app.current.codeWorkspace.newBlock("throw");
        const error = window.app.current.codeWorkspace.newBlock("iterables_string");
        error.setFieldValue("Invalid costume name", "TEXT");
        error.setShadow(true);

        throwBlock.getInput("ERROR")!.connection!.connect(error.outputConnection!);
        block.getInput("ELSE")!.connection!.connect(throwBlock.previousConnection!);

        const name = this.provide(block, {
            args: [],
            name: type,
            returns: "String",
            comment: "Returns the name of the asset before renaming."
        });

        const call = window.app.current.codeWorkspace.newBlock("call");
        call.loadExtraState!({
            name,
            params: [],
            returnType: "String"
        });

        return call;
    }
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
}

declare namespace SB3 {
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
        isStage: boolean;
        variables: Record<string, Variable>;
        lists: Record<string, unknown>;
        costumes: Costume[];
        currentCostume: number;
        sounds: Sound[];
        blocks: Record<string, Block>;
    }

    interface Stage extends Target {
        name: "string";
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