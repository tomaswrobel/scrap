/**
 * This file is a part of Scrap, an educational programming language.
 * You should have received a copy of the MIT License, if not, please 
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap. 
 * 
 * @license MIT
 * @author Tomáš Wróbel
 * @fileoverview Block transformer for TypeScript code.
 * 
 * This file is responsible for transforming TypeScript code into Blockly
 * blocks. It uses Babel to parse the code and Blockly to generate the
 * blocks. The transformation is done in a way that the blocks are
 * generated in the same order as the code is written. This is done by
 * traversing the AST and creating blocks for each node. 
 */
import * as Blockly from "blockly";
import type {Entity} from "../../components/entity";
import {Error, properties, toCheck} from "../../blockly";
import type {types as Types} from "@babel/core";
import {getPropertyContents, getType, isIdentifier, isProperty} from "./utils";

export default class Blocks {
    connection?: Blockly.Connection | null;
    functions = new Map<string, any>();
    variables: app.Variable[] = [];

    private constructor(
        readonly workspace: Blockly.Workspace,
        readonly babel: typeof Types
    ) {}

    static async processEntity(e: Entity) {
        const babel = await import("@babel/core");
        const tree = await babel.parseAsync(e.code as string, {
            filename: "script.ts",
            presets: [
                await import("@babel/preset-typescript")
            ]
        });

        if (tree) {
            const parser = new this(e.workspace, babel.types);
            tree.program.body.forEach(parser.parse, parser);
            e.variables = parser.variables;
        }
    }

    static async getVariables(code: string) {
        const babel = await import("@babel/core");
        const tree = await babel.parseAsync(code, {
            filename: "script.ts",
            presets: [
                await import("@babel/preset-typescript")
            ]
        });

        if (!tree) {
            return [];
        }

        const variables = new Array<app.Variable>();

        babel.traverse(tree, {
            TSInterfaceDeclaration(path) {
                if (path.node.id.name === "Variables") {
                    for (const property of path.node.body.body) {
                        if (property.type === "TSPropertySignature") {
                            if (property.key.type === "StringLiteral" || property.key.type === "Identifier") {
                                variables.push([
                                    getPropertyContents(property.key),
                                    getType(property.typeAnnotation?.typeAnnotation)
                                ]);
                            }
                        }
                    }
                }
            }
        });

        return variables;
    }

    comments(block: Blockly.Block, node: Types.Node) {
        if (node.leadingComments) {
            block.setCommentText(node.leadingComments.reduce((a, b) => a + b.value + "\n", "").trim());
        }
    }

    block(type: string) {
        const block = this.workspace.newBlock(type);

        if (this.connection) {
            if (block.previousConnection) {
                block.previousConnection.connect(this.connection);
            } else if (block.outputConnection) {
                block.outputConnection.connect(this.connection);
            }
        }

        return block;
    }

    parseArguments(block: Blockly.Block, nodes: Types.CallExpression["arguments"]) {
        let i = 0;

        const inputs = block.inputList.filter(input => {
            if (input.type === Blockly.inputs.inputTypes.VALUE) {
                // Skip inputs that are already connected
                if (input.connection?.isConnected()) {
                    i++;
                }
                return true;
            }
            return false;
        });

        // Sorry for unusual for loop :-)
        for (const shift = i; i < inputs.length; i++) {
            const {connection} = inputs[i];

            this.connection = connection;
            this.parse(nodes[i - shift]);
        }

        if (!block.previousConnection && !block.outputConnection) {
            const arg = nodes[i];

            if (arg?.type === "FunctionExpression" || arg?.type === "ArrowFunctionExpression") {
                this.connection = block.nextConnection;
                this.parse(arg.body);
            }

            this.connection = null;
        } else {
            this.connection = block.nextConnection;
        }
    }

    parse(node?: Types.Node | null): void {
        if (node) switch (node.type) {
            case "TSAnyKeyword": {
                const block = this.block("type");
                block.setFieldValue("any", "TYPE");
                this.connection?.setShadowState({type: "type"});
                break;
            }
            case "TSStringKeyword": {
                const block = this.block("type");
                block.setFieldValue("string", "TYPE");
                break;
            }
            case "TSBooleanKeyword": {
                const block = this.block("type");
                block.setFieldValue("boolean", "TYPE");
                break;
            }
            case "TSNumberKeyword": {
                const block = this.block("type");
                block.setFieldValue("number", "TYPE");
                break;
            }
            case "TSArrayType": {
                const block = this.block("generic");
                block.setFieldValue("Array", "ITERABLE");
                this.connection = block.getInput("TYPE")!.connection;
                this.parse(node.elementType);
                break;
            }
            case "TSUnionType": {
                const block = this.block("union");

                block.loadExtraState!({
                    count: node.types.length
                });

                for (let i = 0; i < node.types.length; i++) {
                    this.connection = block.getInput(`TYPE${i}`)!.connection;
                    this.parse(node.types[i]);
                }

                break;
            }
            case "TSExpressionWithTypeArguments": {
                if (node.expression.type === "Identifier") {
                    if (node.expression.name === "Array" || node.expression.name === "Iterable") {
                        const block = this.block("generic");
                        block.setFieldValue(node.expression.name, "ITERABLE");
                        this.connection = block.getInput("TYPE")!.connection;
                        this.parse(node.typeParameters?.params?.[0]);
                    } else if (node.expression.name === "Sprite") {
                        const block = this.block("type");
                        block.setFieldValue("Sprite", "TYPE");
                    } else {
                        throw new TypeError(`Type "${node.expression.name}" is not known generic`);
                    }
                }
                break;
            }
            case "TSParenthesizedType": {
                return this.parse(node.typeAnnotation);
            }
            case "TSTypeReference": {
                if (node.typeName.type === "Identifier") {
                    if (node.typeName.name === "Date" || node.typeName.name === "Color" || node.typeName.name === "Sprite") {
                        const block = this.block("type");
                        block.setFieldValue(node.typeName.name, "TYPE");
                    } else {
                        throw new TypeError(`Unknown type "${node.typeName.type}"`);
                    }
                }
                break;
            }
            case "ExpressionStatement": {
                this.parse(node.expression);
                break;
            };
            case "NewExpression": {
                if (isIdentifier(node.callee, "Date")) {
                    if (node.arguments.length === 0) {
                        this.block("today");
                    }
                    if (node.arguments.length === 1 && node.arguments[0].type === "StringLiteral") {
                        const block = this.block("date");
                        block.setFieldValue(node.arguments[0].value, "DATE");
                        break;
                    }
                } else if (isIdentifier(node.callee, "Array")) {
                    const block = this.block("array");
                    block.loadExtraState!({
                        items: node.arguments.map(arg => {
                            if (arg.type === "SpreadElement") {
                                return "iterable";
                            } else {
                                return "single";
                            }
                        })
                    });

                    this.connection = block.getInput("TYPE")!.connection;
                    this.connection!.setShadowState({type: "type"});
                    this.parse(node.typeParameters!.params[0]);

                    node.arguments.forEach((arg, i) => {
                        this.connection = block.getInput(`ADD${i}`)!.connection;
                        this.parse(arg);
                    });

                    this.connection = block.nextConnection;

                    break;
                }
                throw new SyntaxError("Unknown class");
            }
            case "SpreadElement":
                return this.parse(node.argument);
            case "NullLiteral":
                break;
            case "NumericLiteral": {
                this.connection?.setShadowState({
                    type: "math_number",
                    fields: {
                        NUM: node.value
                    }
                });
                break;
            }
            case "StringLiteral": {
                this.connection?.setShadowState({
                    type: "iterables_string",
                    fields: {
                        TEXT: node.value
                    }
                });
                break;
            }
            case "BooleanLiteral": {
                this.block("boolean").setFieldValue(node.value.toString(), "BOOL");
                break;
            }
            case "ReturnStatement": {
                const block = this.block("return");
                this.comments(block, node);

                if (node.argument) {
                    block.loadExtraState!({output: "any"});
                    this.connection = block.getInput("VALUE")!.connection;
                    this.parse(node.argument);
                }

                this.connection = null;
                break;
            }
            case "ContinueStatement": {
                const block = this.block("continue");
                this.comments(block, node);
                this.connection = null;
                break;
            }
            case "BreakStatement": {
                const block = this.block("break");
                this.comments(block, node);
                this.connection = null;
                break;
            }
            case "ThrowStatement": {
                const block = this.block("throw");
                this.comments(block, node);
                this.connection = block.getInput("ERROR")!.connection;
                this.parse(node.argument);
                this.connection = null;
                break;
            }
            case "BlockStatement":
                node.body.forEach(this.parse, this);
                break;
            case "VariableDeclaration": {
                for (let i = 0; i < node.declarations.length; i++) {
                    const {id, init} = node.declarations[i];
                    const block = this.block("variable");

                    block.setFieldValue(node.kind, "kind");

                    if (id.type !== "Identifier") {
                        throw new SyntaxError("Only simple identifiers are supported");
                    }

                    this.connection = block.getInput("VAR")!.connection;
                    const typed = this.block("typed");
                    this.connection = typed.getInput("TYPE")!.connection;
                    if (id.typeAnnotation?.type === "TSTypeAnnotation") {
                        typed.setFieldValue(
                            `${id.name}:${getType(id.typeAnnotation.typeAnnotation)}`,
                            "PARAM"
                        );
                        this.parse(id.typeAnnotation.typeAnnotation);
                        this.connection?.targetBlock()?.setShadow(true);
                    } else {
                        this.connection?.setShadowState({
                            type: "type"
                        });
                        typed.setFieldValue(id.name, "PARAM");
                    }

                    this.connection = block.getInput("VALUE")!.connection;
                    this.parse(init);

                    this.connection = block.nextConnection;
                }
                break;
            }
            case "TryStatement": {
                const block = this.block("tryCatch");

                this.connection = block.getInput("TRY")!.connection;
                this.parse(node.block);

                if (node.handler && node.finalizer) {
                    const {param, body} = node.handler;

                    if (param && param.type !== "Identifier") {
                        throw new SyntaxError("Only simple identifiers are supported");
                    }

                    block.loadExtraState!({
                        catch: param ? param.name : true,
                        finally: true,
                    });

                    this.connection = block.getInput("CATCH")!.connection;
                    this.parse(body);

                    this.connection = block.getInput("FINALLY")!.connection;
                    this.parse(node.finalizer);
                } else if (node.handler) {
                    const {param, body} = node.handler;

                    if (param && param.type !== "Identifier") {
                        throw new SyntaxError("Only simple identifiers are supported");
                    }

                    block.loadExtraState!({
                        catch: param ? param.name : true,
                        finally: false,
                    });

                    this.connection = block.getInput("CATCH")!.connection;
                    this.parse(body);
                } else if (node.finalizer) {
                    block.loadExtraState!({
                        finally: true,
                        catch: false,
                    });

                    this.connection = block.getInput("FINALLY")!.connection;
                    this.parse(node.finalizer);
                }

                this.connection = block.nextConnection;

                break;
            }
            case "IfStatement": {
                const block = this.block("controls_if");
                this.comments(block, node);

                this.connection = block.getInput("IF0")!.connection;
                this.parse(node.test);

                this.connection = block.getInput("DO0")!.connection;
                this.parse(node.consequent);

                let elseIfCount = 0,
                    elseIfStatements: Types.IfStatement[] = [],
                    alternate = node.alternate;

                while (alternate && alternate.type === "IfStatement") {
                    elseIfCount++;
                    elseIfStatements.push(alternate);
                }

                const hasElse = alternate?.type === "BlockStatement";

                block.loadExtraState!({
                    elseIfCount,
                    hasElse,
                });

                for (const elseIf of elseIfStatements) {
                    this.connection = block.getInput(`IF${elseIfCount}`)!.connection;
                    this.parse(elseIf.test);

                    this.connection = block.getInput(`DO${elseIfCount}`)!.connection;
                    this.parse(elseIf.consequent);
                }

                if (hasElse) {
                    this.connection = block.getInput("ELSE")!.connection;
                    this.parse(alternate!);
                }

                this.connection = block.nextConnection;

                break;
            }
            case "WhileStatement": {
                const block = this.block("while");
                this.comments(block, node);

                this.connection = block.getInput("CONDITION")!.connection;
                this.parse(node.test);

                this.connection = block.getInput("STACK")!.connection;
                this.parse(node.body);

                this.connection = block.nextConnection;

                break;
            }
            case "ForStatement": {
                const {init, update, test, body} = node;

                if (!init && !update && !test) { // while true
                    const block = this.block("while");
                    this.comments(block, node);
                    this.connection = block.getInput("CONDITION")!.connection;
                    this.block("boolean");

                    this.connection = block.getInput("STACK")!.connection;
                    this.parse(node.body);

                    this.connection = block.nextConnection;
                } else try {
                    if (!init || !update) {
                        throw new SyntaxError("Only for loops with init and update are supported");
                    }

                    if (!test) {
                        throw new SyntaxError("Only for loops with test are supported");
                    }

                    if (init.type !== "VariableDeclaration") {
                        throw new SyntaxError("Only variable declarations are supported");
                    }

                    if (test.type !== "BinaryExpression") {
                        throw new SyntaxError("Only binary expressions are supported");
                    }

                    if (test.operator !== "<=") {
                        throw new SyntaxError("Only <= binary expressions are supported");
                    }

                    if (update.type !== "UpdateExpression") {
                        throw new SyntaxError("Only update expressions are supported");
                    }

                    if (update.operator !== "++") {
                        throw new SyntaxError("Only ++ update expressions are supported");
                    }

                    if (init.declarations.length !== 1) {
                        throw new SyntaxError("Only one variable declaration is supported");
                    }

                    const {id, init: dec} = init.declarations[0];

                    if (!dec) {
                        throw new SyntaxError("Only variable declarations with initializers are supported");
                    }

                    if (id.type !== "Identifier") {
                        throw new SyntaxError("Only simple identifiers are supported");
                    }

                    if (test.left.type !== "Identifier") {
                        throw new SyntaxError("Only simple identifiers are supported");
                    }

                    if (test.left.name !== id.name) {
                        throw new SyntaxError("Only for loops with the same variable in init and test are supported");
                    }

                    if (update.argument.type !== "Identifier") {
                        throw new SyntaxError("Only simple identifiers are supported");
                    }

                    if (update.argument.name !== id.name) {
                        throw new SyntaxError("Only for loops with the same variable in init and update are supported");
                    }

                    const block = this.block("for");
                    block.setFieldValue(`${id.name}:number`, "VAR");
                    this.comments(block, node);

                    this.connection = block.getInput("TO")!.connection;
                    this.parse(test.right);

                    this.connection = block.getInput("FROM")!.connection;
                    this.parse(dec);

                    this.connection = block.getInput("STACK")!.connection;
                    this.parse(body);

                    this.connection = block.nextConnection;
                } catch (e) { // Convert to "while" block
                    this.parse(node.init);

                    const block = this.block("while");
                    this.comments(block, node);

                    this.connection = block.getInput("CONDITION")!.connection;
                    this.parse(node.test);

                    this.connection = block.getInput("STACK")!.connection;
                    this.parse(node.body);

                    this.connection = block.nextConnection;
                    this.parse(node.update);
                }

                break;
            }
            case "FunctionDeclaration": {
                const {id, params, body} = node;

                if (!id) {
                    throw new SyntaxError("Only named functions are supported");
                }

                let commentText = "";

                const block = this.workspace.newBlock("function");
                block.setFieldValue(id.name, "NAME");

                const extraState = {
                    params: new Array<string>(),
                    returns: node.returnType?.type === "TSTypeAnnotation" && node.returnType.typeAnnotation.type !== "TSVoidKeyword"
                };

                const types = new Array<babel.types.TSType | null>();
                const savedTypes = new Array<app.Check>();

                for (const param of params) {
                    if (param.type !== "Identifier") {
                        continue;
                    }

                    extraState.params.push(param.name);

                    if (param.typeAnnotation?.type === "TSTypeAnnotation") {
                        types.push(param.typeAnnotation.typeAnnotation);
                    } else {
                        types.push(null);
                    }
                }
                block.loadExtraState!(extraState);

                types.forEach((type, i) => {
                    this.connection = block.getInput(`PARAM_${i}`)!.connection!.targetBlock()!.getInput("TYPE")!.connection!;
                    this.parse(type);
                    savedTypes.push(toCheck(this.connection.targetBlock()));
                });

                if (this.connection = block.getInput("RETURNS")?.connection) {
                    this.parse((node.returnType as Types.TSTypeAnnotation).typeAnnotation);
                    savedTypes.push(toCheck(this.connection.targetBlock()));
                }

                this.functions.set(id.name, extraState);
                block.setCommentText(commentText.trim());

                this.connection = block.nextConnection;
                this.parse(body);

                this.connection = null;

                break;
            }
            case "ArrayExpression": {
                const block = this.block("array");

                block.loadExtraState!({
                    items: node.elements.map(element => {
                        if (element?.type === "SpreadElement") {
                            return "iterable";
                        } else {
                            return "single";
                        }
                    }),
                });

                node.elements.forEach((element, i) => {
                    this.connection = block.getInput(`ADD${i}`)!.connection;
                    this.parse(element);
                });

                this.connection = null;

                break;
            }
            case "CallExpression": {
                if (node.callee.type === "MemberExpression") {
                    if (isIdentifier(node.callee.object, "window") && isProperty(node.callee, "alert", "prompt", "confirm")) {
                        const block = this.block(getPropertyContents(node.callee.property));
                        this.connection = block.getInput("TEXT")!.connection!;
                        this.parse(node.arguments[0]);
                        this.connection = block.nextConnection;
                    } else if (isIdentifier(node.callee.object, "Color")) {
                        if (isProperty(node.callee, "fromHex")) {
                            const block = this.block("color");
                            if (node.arguments[0].type === "StringLiteral") {
                                block.setFieldValue(node.arguments[0].value, "COLOR");
                            } else {
                                throw new SyntaxError("Only string literals are supported");
                            }
                        } else if (isProperty(node.callee, "fromRGB")) {
                            const block = this.block("rgb");
                            this.connection = block.getInput("RED")!.connection!;
                            this.parse(node.arguments[0]);
                            this.connection = block.getInput("GREEN")!.connection!;
                            this.parse(node.arguments[1]);
                            this.connection = block.getInput("BLUE")!.connection!;
                            this.parse(node.arguments[2]);
                        } else if (isProperty(node.callee, "random")) {
                            this.block("color_random");
                        }
                    } else if (isIdentifier(node.callee.object, "Scrap") && isProperty(node.callee, "delete")) {
                        const block = this.block("stop");
                        this.comments(block, node);
                        this.connection = null;
                    } else if (isProperty(node.callee, "clone")) {
                        const block = this.block("clone");
                        this.comments(block, node);
                        this.connection = block.getInput("SPRITE")!.connection!;
                        this.parse(node.callee.object);
                        this.connection = block.nextConnection;
                    } else if (isProperty(node.callee, "reverse", "includes", "indexOf", "slice")) {
                        const block = this.block(getPropertyContents(node.callee.property));
                        this.connection = block.getInput("ITERABLE")!.connection!;
                        this.parse(node.callee.object);
                        this.parseArguments(block, node.arguments);
                    } else if (isProperty(node.callee, "join")) {
                        const block = this.block("join");
                        this.connection = block.getInput("ITERABLE")!.connection!;
                        this.parse(node.callee.object);
                        this.connection = block.getInput("SEPARATOR")!.connection!;
                        this.parse(node.arguments[0]);
                    } else if (isProperty(
                        node.callee,
                        "getFullYear",
                        "getMonth",
                        "getDate",
                        "getDay",
                        "getHours",
                        "getMinutes",
                        "getSeconds"
                    )) {
                        const block = this.block("dateProperty");
                        block.setFieldValue(getPropertyContents(node.callee.property), "PROPERTY");
                        this.connection = block.getInput("DATE")!.connection!;
                        this.parse(node.callee.object);
                    } else if (isIdentifier(node.callee.object, "self") && isProperty(node.callee, ...properties)) {
                        const block = this.block(getPropertyContents(node.callee.property));
                        this.comments(block, node);
                        this.parseArguments(block, node.arguments);
                    } else if (isIdentifier(node.callee.object, "Math")) {
                        if (isProperty(
                            node.callee,
                            "abs",
                            "floor",
                            "round",
                            "ceil",
                            "sqrt",
                            "sin",
                            "cos",
                            "tan",
                            "asin",
                            "acos",
                            "atan",
                            "log",
                            "log10",
                            "exp",
                        )) {
                            const block = this.block("math");
                            block.setFieldValue(getPropertyContents(node.callee.property), "OP");
                            this.connection = block.getInput("NUM")!.connection!;
                            this.parse(node.arguments[0]);
                        } else if (isProperty(node.callee, "random")) {
                            this.block("random");
                        } else {
                            throw new SyntaxError("Unsupported Math function");
                        }
                    } else {
                        throw new SyntaxError("Unsupported function call");
                    }
                } else if (node.callee.type === "Identifier") {
                    if (this.functions.has(node.callee.name)) {
                        const block = this.workspace.newBlock("call");
                        block.loadExtraState!(this.functions.get(node.callee.name));

                        if (this.connection) {
                            if (block.previousConnection) {
                                block.previousConnection.connect(this.connection);
                            } else if (block.outputConnection) {
                                block.outputConnection.connect(this.connection);
                            }
                        }

                        for (let i = 0; i < node.arguments.length; i++) {
                            this.connection = block.getInput(`PARAM_${i}`)!.connection;
                            this.parse(node.arguments[i]);
                        }

                        this.connection = block.nextConnection;
                    } else if (node.callee.name === "String") {
                        const block = this.block("string");
                        this.connection = block.getInput("VALUE")!.connection;
                        this.parse(node.arguments[0]);
                    } else if (node.callee.name === "Number") {
                        const block = this.block("number");
                        this.connection = block.getInput("VALUE")!.connection;
                        this.parse(node.arguments[0]);
                    } else {
                        throw new SyntaxError(`Function ${node.callee.name} used before definition`);
                    }
                } else {
                    throw new SyntaxError("Unsupported function call");
                }
                break;
            }
            case "MemberExpression": {
                const {object, property} = node;

                if (property.type !== "Identifier" && property.type !== "StringLiteral") {
                    const block = this.block("item");
                    this.connection = block.getInput("INDEX")!.connection;
                    this.parse(property);

                    this.connection = block.getInput("ITERABLE")!.connection;
                    this.parse(object);
                } else if (isIdentifier(property, "length")) {
                    const block = this.block("length");
                    this.connection = block.getInput("VALUE")!.connection;
                    this.parse(object);
                } else if (isIdentifier(object, "self") && isProperty(node, ...properties)) {
                    this.block(getPropertyContents(property));
                } else if (object.type === "MemberExpression" && isProperty(object, "effects")) {
                    if (isIdentifier(object.object, "self")) {
                        const block = this.block("effect");
                        block.setFieldValue(getPropertyContents(property), "EFFECT");
                    } else if (object.object.type === "MemberExpression" && isIdentifier(object.object.object, "$")) {
                        if (object.object.property.type !== "StringLiteral" && object.object.property.type !== "Identifier") {
                            throw new SyntaxError("Only simple identifiers and string literals are supported");
                        }

                        const block = this.block("property");
                        block.setFieldValue(getPropertyContents(object.object.property), "SPRITE");
                        block.setFieldValue(`effects.${getPropertyContents(property)}`, "PROPERTY");
                    } else {
                        throw new SyntaxError("Unsupported object");
                    }
                } else if (object.type === "MemberExpression" && isProperty(object, "variables")) {
                    if (isIdentifier(object.object, "self")) {
                        const block = this.workspace.newBlock("parameter");
                        const variable = this.variables.find(([name]) => name === getPropertyContents(property));
                        block.loadExtraState!({
                            isVariable: true,
                            type: variable ? variable[1] : "any"
                        });
                        block.setFieldValue(getPropertyContents(property), "VAR");
                        this.connection?.connect(block.outputConnection!);
                    } else if (object.object.type === "MemberExpression" && isIdentifier(object.object.object, "$")) {
                        if (object.object.property.type !== "StringLiteral" && object.object.property.type !== "Identifier") {
                            throw new SyntaxError("Only simple identifiers and string literals are supported");
                        }

                        const block = this.block("property");
                        block.setFieldValue(getPropertyContents(object.object.property), "SPRITE");
                        block.setFieldValue(`variables[${JSON.stringify(getPropertyContents(property))}]`, "PROPERTY");
                    } else {
                        throw new SyntaxError("Unsupported object");
                    }
                } else if (object.type === "MemberExpression" && isProperty(object, "costume", "backdrop")) {
                    const type = getPropertyContents(object.property);
                    const prop = getPropertyContents(property);
                    if (type === "backdrop" || isIdentifier(object.object, "self")) {
                        if (prop === "all") {
                            this.block(`${type}.all`);
                        } else {
                            const block = this.block(type);
                            block.setFieldValue(prop, "VALUE");
                        }
                    } else if (object.object.type === "MemberExpression" && isIdentifier(object.object.object, "$")) {
                        if (object.object.property.type !== "StringLiteral" && object.object.property.type !== "Identifier") {
                            throw new SyntaxError("Only simple identifiers and string literals are supported");
                        }
                        const block = this.block("property");
                        block.setFieldValue(getPropertyContents(object.object.property), "SPRITE");
                        block.setFieldValue(`${type}.${prop}`, "PROPERTY");
                    } else {
                        throw new SyntaxError("Unsupported object");
                    }
                } else if (isProperty(node,
                    "x",
                    "y",
                    "size",
                    "direction",
                    "volume",
                    "penSize",
                    "penColor",
                    "visible",
                    "draggable"
                )) {
                    if (node.object.type === "MemberExpression" && isIdentifier(node.object.object, "$")) {
                        if (node.object.property.type !== "StringLiteral" && node.object.property.type !== "Identifier") {
                            throw new SyntaxError("Only simple identifiers and string literals are supported");
                        }

                        const block = this.block("property");
                        block.setFieldValue(getPropertyContents(node.object.property), "SPRITE");
                        block.setFieldValue(getPropertyContents(property), "PROPERTY");
                    } else {
                        throw new SyntaxError("Unsupported object");
                    }
                } else if (object.type === "Identifier") {
                    if (object.name === "$") {
                        this.connection?.setShadowState({
                            type: "sprite",
                            fields: {
                                SPRITE: getPropertyContents(property)
                            }
                        });
                    } else if (object.name === "Scrap") {
                        if (isProperty(node, "isTurbo")) {
                            this.block("isTurbo");
                        } else {
                            throw new SyntaxError("Unsupported Scrap property");
                        }
                    } else if (object.name === "Math") {
                        if (isProperty(node, "PI", "E")) {
                            const block = this.block("constant");
                            block.setFieldValue("Math." + getPropertyContents(property), "CONSTANT");
                        } else {
                            throw new SyntaxError("Unsupported Math constant");
                        }
                    } else {
                        throw new SyntaxError("Unsupported object");
                    }
                } else {
                    throw new SyntaxError("Unsupported sprite property");
                }
                break;
            }
            case "BinaryExpression":
            case "LogicalExpression": {
                switch (node.operator) {
                    case "+":
                    case "-":
                    case "*":
                    case "/":
                    case "%":
                    case "**": {
                        const block = this.block("arithmetics");
                        block.setFieldValue(node.operator, "OP");
                        this.connection = block.getInput("A")!.connection;
                        this.parse(node.left);
                        this.connection = block.getInput("B")!.connection;
                        this.parse(node.right);
                        break;
                    }
                    case "!=":
                    case "==":
                    case "===":
                    case "!==":
                    case "<":
                    case "<=":
                    case ">":
                    case ">=": {
                        const block = this.block("compare");
                        block.setFieldValue(node.operator.slice(0, 2), "OP");
                        this.connection = block.getInput("A")!.connection;
                        this.parse(node.left);
                        this.connection = block.getInput("B")!.connection;
                        this.parse(node.right);
                        break;
                    }
                    case "&&":
                    case "||": {
                        const block = this.block("operation");
                        block.setFieldValue(node.operator, "OP");
                        this.connection = block.getInput("A")!.connection;
                        this.parse(node.left);
                        this.connection = block.getInput("B")!.connection;
                        this.parse(node.right);
                        break;
                    }
                    default: {
                        throw new SyntaxError("Unsupported operator");
                    }
                }
                break;
            }
            case "UpdateExpression": {
                const block = this.block("change");

                this.connection = block.getInput("VAR")!.connection!;
                this.connection.setShadowState({type: "x"});
                this.parse(node.argument);

                block.getInput("VALUE")!.connection!.setShadowState({
                    type: "math_number",
                    fields: {
                        NUM: node.operator === "--" ? -1 : 1
                    }
                });

                break;
            }
            case "UnaryExpression": {
                if (node.operator === "!") {
                    const block = this.block("not");
                    this.connection = block.getInput("BOOL")!.connection;
                    this.parse(node.argument);
                } else if (node.operator === "-") {
                    if (node.argument.type === "NumericLiteral") {
                        const block = this.block("math_number");
                        block.setFieldValue(-node.argument.value, "NUM");
                    } else {
                        const block = this.block("arithmetics");
                        block.setFieldValue("-", "OP");
                        this.comments(block, node);

                        block.getInput("A")!.connection!.setShadowState({type: "math_number"});
                        this.connection = block.getInput("B")!.connection;
                        this.parse(node.argument);
                    }
                } else if (node.operator === "+") {
                    const block = this.block("number");
                    this.connection = block.getInput("VALUE")!.connection;
                    this.parse(node.argument);
                } else {
                    throw new SyntaxError("Unsupported operator");
                }
                break;
            }
            case "AssignmentExpression": {
                if (node.left.type !== "Identifier" && node.left.type !== "MemberExpression") {
                    throw new SyntaxError("Only simple identifiers and member expressions are supported");
                }

                switch (node.operator) {
                    case "=": {
                        var block = this.block("set");
                        var argument = node.right;
                        break;
                    }
                    case "+=": {
                        var block = this.block("change");
                        var argument = node.right;
                        break;
                    }
                    default: {
                        var block = this.block("set");
                        var argument: Types.Expression = this.babel.binaryExpression(
                            node.operator.slice(0, -1) as Types.BinaryExpression["operator"],
                            node.left,
                            node.right
                        );
                    }
                }

                this.connection = block.getInput("VAR")!.connection!;
                this.connection.setShadowState({type: "x"});
                this.parse(node.left)!;

                this.connection = block.getInput("VALUE")!.connection;
                this.parse(argument);
                this.connection = block.nextConnection;

                break;
            }
            case "ForOfStatement": {
                const {left, right, body} = node;

                if (left.type !== "VariableDeclaration") {
                    throw new SyntaxError("Only variable declarations are supported");
                }

                if (left.declarations.length !== 1) {
                    throw new SyntaxError("Only one variable declaration is supported");
                }

                const [{id}] = left.declarations;

                if (id.type !== "Identifier") {
                    throw new SyntaxError("Only simple identifiers are supported");
                }

                const block = this.block("foreach");
                block.setFieldValue(id.name, "VAR");

                this.connection = block.getInput("ITERABLE")!.connection;
                this.parse(right);

                this.connection = block.getInput("DO")!.connection;
                this.parse(body);

                this.connection = block.nextConnection;
                break;
            }
            case "Identifier": {
                if (node.name === "self") {
                    this.connection?.setShadowState({
                        type: "sprite"
                    });
                } else if (node.name === "Infinity" || node.name === "NaN") {
                    this.block("constant").setFieldValue(node.name, "CONSTANT");
                } else {
                    const block = this.workspace.newBlock("parameter");
                    block.loadExtraState!({
                        isVariable: false,
                        type: "any"
                    });
                    this.connection?.connect(block.outputConnection!);
                    block.setFieldValue(node.name, "VAR");
                }
                break;
            }
            case "TSInterfaceDeclaration": {
                if (node.id.name === "Variables") {
                    for (const property of node.body.body) {
                        if (property.type === "TSPropertySignature") {
                            if (property.key.type === "StringLiteral" || property.key.type === "Identifier") {
                                this.variables.push([
                                    getPropertyContents(property.key),
                                    getType(property.typeAnnotation?.typeAnnotation)
                                ]);
                            }
                        }
                    }
                    break;
                } else {
                    throw new SyntaxError("Only 'Variables' interface is supported");
                }
            }
            default: throw new SyntaxError(`Unsupported node type ${node.type}. ${Error}`);
        }
    }
}