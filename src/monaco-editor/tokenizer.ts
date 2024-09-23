/**
 * This file is a part of Scrap, an educational programming language.
 * You should have received a copy of the MIT License, if not, please 
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap. 
 * 
 * @license MIT [from-monaco-editor]
 * @author Microsoft Corporation
 * 
 * @license MIT
 * @author Tomáš Wróbel
 * 
 * The tokenizer is created by Microsoft, I only mapped identifiers
 * to Scrap blocks. For that, I created a new theme on my own.
 */
import {editor, languages} from "monaco-editor";

languages.registerTokensProviderFactory("typescript", {
    create: () => ({
        // Set defaultToken to invalid to see what you do not tokenize yet
        defaultToken: "invalid",
        tokenPostfix: ".ts",
        motion: [
            "move",
            "turnLeft",
            "turnRight",
            "pointInDirection",
            "pointTowards",
            "pointTo",
            "goTo",
            "goTowards",
            "glide",
            "x",
            "y",
            "direction",
            "setRotationStyle",
            "ifOnEdgeBounce"
        ],
        looks: [
            "sayWait",
            "say",
            "think",
            "thinkWait",
            "switchCostumeTo",
            "nextCostume",
            "switchBackdropToWait",
            "switchBackdropTo",
            "nextBackdrop",
            "show",
            "hide",
            "goForward",
            "goBackward",
            "goToFront",
            "goToBack",
            "visible",
            "size",
        ],
        sounds: [
            "playSound",
            "playSoundUntilDone",
            "volume",
            "stopSounds"
        ],
        pen: [
            "penClear",
            "penDown",
            "penUp",
            "isPenDown",
            "stamp",
            "penSize",
            "penColor",
        ],
        events: [
            "whenFlag",
            "whenBackdropChangesTo",
            "whenKeyPressed",
            "whenTimerElapsed",
            "whenMouse",
            "whenLoaded",
            "broadcastMessage",
            "whenReceiveMessage",
            "broadcastMessageWait"
        ],
        flow: [
            "if",
            "else",
            "for",
            "do",
            "while",
            "break",
            "continue",
            "try",
            "catch",
            "finally",
            "throw"
        ],
        controls: [
            "wait",
            "delete",
            "clone",
            "stop",
            "whenCloned"
        ],
        sensing: [
            "isTouching",
            "isTouchingBackdropColor",
            "isTouchingEdge",
            "isTouchingMouse",
            "distanceTo",
            "ask",
            "isKeyPressed",
            "mouseDown",
            "mouseX",
            "mouseY",
            "draggable",
            "getTimer",
            "resetTimer",
            // Date
            "getFullYear",
            "getMonth",
            "getDate",
            "getDay",
            "getHours",
            "getMinutes",
            "getSeconds",
            // Window
            "alert",
            "confirm",
            "prompt",
            "isTurbo",
            // size
            "width",
            "height",
        ],
        math: [
            "abs",
            "floor",
            "ceil",
            "round",
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
            "PI",
            "E",
            "random"
        ],
        types: [
            "number",
            "string",
            "boolean",
            "any",
            "true",
            "false",
            "Infinity",
            "NaN",
            "String",
            "NUmber",
            "Boolean"
        ],
        iterables: [
            "length",
            "reverse",
            "join",
            "includes",
            "indexOf",
            "slice"
        ],
        functions: [
            "function",
            "call",
            "window",
            "interface",
            "const",
            "var",
            "let",
            "new",
            "namespace"
        ],
        variables: [
            "variables",
            "showVariable",
            "hideVariable",
        ],
        operators: [
            "<=",
            ">=",
            "==",
            "!=",
            "===",
            "!==",
            "=>",
            "+",
            "-",
            "**",
            "*",
            "/",
            "%",
            "++",
            "--",
            "<<",
            "</",
            ">>",
            ">>>",
            "&",
            "|",
            "^",
            "!",
            "~",
            "&&",
            "||",
            "??",
            "?",
            ":",
            "=",
            "+=",
            "-=",
            "*=",
            "**=",
            "/=",
            "%=",
            "<<=",
            ">>=",
            ">>>=",
            "&=",
            "|=",
            "^=",
            "@"
        ],
        // TS/JS keywords invalid in Scrap
        banned: [
            "import",
            "export",
            "default",
            "super",
            "this",
            "static",
            "private",
            "protected",
            "public",
            "readonly",
            "abstract",
            "implements",
            "as",
            "from",
            "type",
            "declare",
            "readonly",
            "keyof",
            "infer",
            "unique",
            "satisfies",
            "is",
            "never",
            "switch",
            "case",
            "typeof",
            "await",
            "async",
            "with",
            "yield",
            "enum",
            "class",
            "extends"
        ],
        sprites: [
            "$",
            "self",
            "Date",
            "Sprite",
            "Stage"
        ],
        // we include these common regular expressions
        symbols: /[=><!~?:&|+\-*\/\^%]+/,
        escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
        digits: /\d+(_+\d+)*/,
        octaldigits: /[0-7]+(_+[0-7]+)*/,
        binarydigits: /[0-1]+(_+[0-1]+)*/,
        hexdigits: /[[0-9a-fA-F]+(_+[0-9a-fA-F]+)*/,
        regexpctl: /[(){}\[\]\$\^|\-*+?\.]/,
        regexpesc: /\\(?:[bBdDfnrstvwWn0\\\/]|@regexpctl|c[A-Z]|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4})/,
        // The main tokenizer for our languages
        tokenizer: {
            root: [[/[{}]/, "delimiter.bracket"], {include: "common"}],
            common: [
                [
                    /(Color)([ \n\t\r]*\.[ \n\t\r]*)(fromHex|random|fromRGB|)/,
                    [
                        "Color",
                        "delimiter",
                        "pen"
                    ]
                ],
                [
                    /(\.[ \n\t\r]*)(costume|backdrop)([ \n\t\r]*\.[ \n\t\r]*)(all|index|name)/,
                    [
                        "delimiter",
                        "costume",
                        "delimiter",
                        "looks"
                    ]
                ],
                [
                    /(\.[ \n\t\r]*)(effects)([ \n\t\r]*\.[ \n\t\r]*)(brightness|color|ghost|grayscale)/,
                    [
                        "delimiter",
                        "costume",
                        "delimiter",
                        "looks"
                    ]
                ],
                // identifiers and keywords
                [
                    /(\.[ \n\t\r]*)([A-Za-z_$][\w$]*)/,
                    [
                        "delimiter",
                        {
                            cases: {
                                "@motion": "motion",
                                "@looks": "looks",
                                "@sounds": "sounds",
                                "@pen": "pen",
                                "@events": "events",
                                "@controls": "controls",
                                "@sensing": "sensing",
                                "@iterables": "iterables",
                                "@math": "operators",
                                "costume": "costume",
                                "backdrop": "costume",
                                "effects": "costume",
                                "@variables": "variables",
                                "@default": "identifier"
                            }
                        }
                    ]
                ],
                [
                    /([A-Za-z_$][\w$]*)/,
                    {
                        cases: {
                            "@flow": "controls",
                            "@types": "operators",
                            "@functions": "functions",
                            "Variables": "interface",
                            "Scrap": "constructor",
                            "@sprites": "sprites",
                            "Array": "array",
                            "Math": "math",
                            "@banned": "error",
                            "@default": "variables",
                        }
                    }
                ],
                // whitespace
                {include: "@whitespace"},
                // regular expression: ensure it is terminated before beginning (otherwise it is an opeator)
                [
                    /\/(?=([^\\\/]|\\.)+\/([dgimsuy]*)(\s*)(\.|;|,|\)|\]|\}|$))/,
                    {token: "regexp", bracket: "@open", next: "@regexp"}
                ],
                // delimiters and operators
                [/[()\[\]]/, "@brackets"],
                [/[<>](?!@symbols)/, "@brackets"],
                [/!(?=([^=]|$))/, "delimiter"],
                [
                    /@symbols/,
                    {
                        cases: {
                            "@operators": "delimiter",
                            "@default": ""
                        }
                    }
                ],
                // numbers
                [/(@digits)[eE]([\-+]?(@digits))?/, "number.float"],
                [/(@digits)\.(@digits)([eE][\-+]?(@digits))?/, "number.float"],
                [/0[xX](@hexdigits)n?/, "number.hex"],
                [/0[oO]?(@octaldigits)n?/, "number.octal"],
                [/0[bB](@binarydigits)n?/, "number.binary"],
                [/(@digits)n?/, "number"],
                // delimiter: after number because of .\d floats
                [/[;,.]/, "delimiter"],
                // strings
                [/"([^"\\]|\\.)*$/, "string.invalid"],
                // non-teminated string
                [/'([^'\\]|\\.)*$/, "string.invalid"],
                // non-teminated string
                [/"/, "string", "@string_double"],
                [/'/, "string", "@string_single"],
                [/`/, "string", "@string_backtick"]
            ],
            whitespace: [
                [/[ \t\r\n]+/, ""],
                [/\/\*\*(?!\/)/, "comment.doc", "@jsdoc"],
                [/\/\*/, "comment", "@comment"],
                [/\/\/.*$/, "comment"]
            ],
            comment: [
                [/[^\/*]+/, "comment"],
                [/\*\//, "comment", "@pop"],
                [/[\/*]/, "comment"]
            ],
            jsdoc: [
                [/[^\/*]+/, "comment.doc"],
                [/\*\//, "comment.doc", "@pop"],
                [/[\/*]/, "comment.doc"]
            ],
            // We match regular expression quite precisely
            regexp: [
                [
                    /(\{)(\d+(?:,\d*)?)(\})/,
                    ["regexp.escape.control", "regexp.escape.control", "regexp.escape.control"]
                ],
                [
                    /(\[)(\^?)(?=(?:[^\]\\\/]|\\.)+)/,
                    ["regexp.escape.control", {token: "regexp.escape.control", next: "@regexrange"}]
                ],
                [/(\()(\?:|\?=|\?!)/, ["regexp.escape.control", "regexp.escape.control"]],
                [/[()]/, "regexp.escape.control"],
                [/@regexpctl/, "regexp.escape.control"],
                [/[^\\\/]/, "regexp"],
                [/@regexpesc/, "regexp.escape"],
                [/\\\./, "regexp.invalid"],
                [/(\/)([dgimsuy]*)/, [{token: "regexp", bracket: "@close", next: "@pop"}, "keyword.other"]]
            ],
            regexrange: [
                [/-/, "regexp.escape.control"],
                [/\^/, "regexp.invalid"],
                [/@regexpesc/, "regexp.escape"],
                [/[^\]]/, "regexp"],
                [
                    /\]/,
                    {
                        token: "regexp.escape.control",
                        next: "@pop",
                        bracket: "@close"
                    }
                ]
            ],
            string_double: [
                [/[^\\"]+/, "string"],
                [/@escapes/, "string.escape"],
                [/\\./, "string.escape.invalid"],
                [/"/, "string", "@pop"]
            ],
            string_single: [
                [/[^\\']+/, "string"],
                [/@escapes/, "string.escape"],
                [/\\./, "string.escape.invalid"],
                [/'/, "string", "@pop"]
            ],
            string_backtick: [
                [/\$\{/, {token: "delimiter.bracket", next: "@bracketCounting"}],
                [/[^\\`$]+/, "string"],
                [/@escapes/, "string.escape"],
                [/\\./, "string.escape.invalid"],
                [/`/, "string", "@pop"]
            ],
            bracketCounting: [
                [/\{/, "delimiter.bracket", "@bracketCounting"],
                [/\}/, "delimiter.bracket", "@pop"],
                {include: "common"}
            ]
        }
    })
});

languages.register({
    id: "typescript",
    extensions: [".ts", ".tsx", ".cts", ".mts"],
    aliases: ["TypeScript", "ts", "typescript"],
    mimetypes: ["text/typescript"],
});

languages.onLanguageEncountered("typescript", () => {
    languages.registerColorProvider("typescript", {
        provideColorPresentations(model, info) {
            const code = model.getValue().slice(
                model.getOffsetAt({
                    lineNumber: info.range.startLineNumber,
                    column: info.range.startColumn
                }),
                model.getOffsetAt({
                    lineNumber: info.range.endLineNumber,
                    column: info.range.endColumn
                })
            );
            const rgb = [Math.round(info.color.red * 255), Math.round(info.color.green * 255), Math.round(info.color.blue * 255)];
            return [
                {
                    label: `rgb(${rgb.join(", ")})`,
                    textEdit: {
                        range: info.range,
                        text: code[0] === '"' ? `"#${rgb.map(s => s.toString(16).padStart(2, "0")).join("")}"` : rgb.join(", ")
                    }
                }
            ];
        },
        async provideDocumentColors(model) {
            const fromRGB = /Color\.fromRGB\((\d+,\s*\d+,\s*\d+)\)/g;
            const fromHex = /Color\.fromHex\("(#[0-9a-fA-F]{6})"\)/g;

            const text = model.getValue();
            const colors: languages.IColorInformation[] = [];

            const startOffset = "Color.from...(".length;
            const endOffset = ")".length;

            let match: RegExpExecArray | null;

            while (match = fromRGB.exec(text)) {
                const start = model.getPositionAt(match.index + startOffset);
                const end = model.getPositionAt(match.index + match[0].length - endOffset);
                const [r, g, b] = match[1].split(/,\s*/).map(Number);

                colors.push({
                    color: {
                        red: r / 255,
                        green: g / 255,
                        blue: b / 255,
                        alpha: 1
                    },
                    range: {
                        startLineNumber: start.lineNumber,
                        startColumn: start.column,
                        endLineNumber: end.lineNumber,
                        endColumn: end.column
                    }
                });
            }

            while (match = fromHex.exec(text)) {
                const start = model.getPositionAt(match.index + startOffset);
                const end = model.getPositionAt(match.index + match[0].length - endOffset);

                const r = Number.parseInt(match[1].slice(1, 3), 16);
                const g = Number.parseInt(match[1].slice(3, 5), 16);
                const b = Number.parseInt(match[1].slice(5, 7), 16);

                colors.push({
                    color: {
                        red: r / 255,
                        green: g / 255,
                        blue: b / 255,
                        alpha: 1
                    },
                    range: {
                        startLineNumber: start.lineNumber,
                        startColumn: start.column,
                        endLineNumber: end.lineNumber,
                        endColumn: end.column
                    }
                });
            }

            return colors;
        },
    });
    languages.setLanguageConfiguration("typescript", {
        wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
        comments: {
            lineComment: "//",
            blockComment: ["/*", "*/"]
        },
        brackets: [
            ["{", "}"],
            ["[", "]"],
            ["(", ")"]
        ],
        onEnterRules: [
            {
                // e.g. /** | */
                beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
                afterText: /^\s*\*\/$/,
                action: {
                    indentAction: languages.IndentAction.IndentOutdent,
                    appendText: " * "
                }
            },
            {
                // e.g. /** ...|
                beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
                action: {
                    indentAction: languages.IndentAction.None,
                    appendText: " * "
                }
            },
            {
                // e.g.  * ...|
                beforeText: /^(\t|(\ \ ))*\ \*(\ ([^\*]|\*(?!\/))*)?$/,
                action: {
                    indentAction: languages.IndentAction.None,
                    appendText: "* "
                }
            },
            {
                // e.g.  */|
                beforeText: /^(\t|(\ \ ))*\ \*\/\s*$/,
                action: {
                    indentAction: languages.IndentAction.None,
                    removeText: 1
                }
            }
        ],
        autoClosingPairs: [
            {open: "{", close: "}"},
            {open: "[", close: "]"},
            {open: "(", close: ")"},
            {open: '"', close: '"', notIn: ["string"]},
            {open: "'", close: "'", notIn: ["string", "comment"]},
            {open: "`", close: "`", notIn: ["string", "comment"]},
            {open: "/**", close: " */", notIn: ["string"]}
        ],
        folding: {
            markers: {
                start: new RegExp("^\\s*//\\s*#?region\\b"),
                end: new RegExp("^\\s*//\\s*#?endregion\\b")
            }
        }
    });
    languages.typescript.typescriptDefaults.setCompilerOptions({
        target: languages.typescript.ScriptTarget.ES2015,
        noEmit: true,
        strict: true,
    });
});

editor.defineTheme("scrap", {
    base: "vs",
    inherit: false,
    rules: [
        {token: "motion", foreground: "4C97FF"},
        {token: "looks", foreground: "9966FF"},
        {token: "pen", foreground: "0FBD8C"},
        {token: "events", foreground: "FFBF00"},
        {token: "controls", foreground: "FFAB19"},
        {token: "sensing", foreground: "5CB1D6"},
        {token: "sprites", foreground: "5CB1D6", fontStyle: "bold"},
        {token: "sounds", foreground: "CF63CF"},
        {token: "iterables", foreground: "FF661A"},
        {token: "variables", foreground: "FF8C1A"},
        {token: "functions", foreground: "FF6680"},
        {token: "operators", foreground: "59C059"},
        {token: "math", foreground: "59C059", fontStyle: "bold"},
        {token: 'comment', foreground: '008000'},
        {token: 'string', foreground: 'A31515'},
        {token: 'number', foreground: '098658'},
        {token: "array", foreground: "FF661A", fontStyle: "bold"},
        {token: "interface", foreground: "FF8C1A", fontStyle: "bold"},
        {token: "constructor", foreground: "FF6680", fontStyle: "bold"},
        {token: "Color", foreground: "59C059", fontStyle: "bold"},
        {token: "costume", foreground: "9966FF", fontStyle: "bold"},
        {token: "error", fontStyle: "strikethrough", foreground: "AA0000"}
    ],
    colors: {
        "editor.background": "#FFFFFF",
        "editor.foreground": "#000000",
        "editor.inactiveSelectionBackground": "#E5EBF1",
        "editorIndentGuide.background1": '#D3D3D3',
        "editorIndentGuide.activeBackground1": '#939393',
        "editor.selectionHighlightBackground": '#ADD6FF4D'
    }
});

editor.setTheme("scrap");