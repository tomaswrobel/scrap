declare namespace Scrap {
    /**
     * Stops the project
     */
    function stop(): void;

    /**
     * Detects if project
     * runs in turbo mode
     */
    const isTurbo: boolean;
}

interface Stage<Variables = {}> {
    /**
     * Graphical effects
     */
    readonly effects: {
        brightness: number,
        color: number,
        ghost: number,
        grayscale: number,
    };

    /**
     * Volume of sounds
     * (0-100)
     */
    volume: number;

    /**
     * The namespace for the variables
     * defined in the **Variables** interface
     */
    readonly variables: Variables;
    /**
     * The X position of the mouse
     */
    readonly mouseX: number;
    /**
     * The Y position of the mouse
     */
    readonly mouseY: number;
    /**
     * If the mouse button is pressed
     */
    readonly mouseDown: boolean;
    /**
     * Namespace for the backdrops
     */
    readonly backdrop: Costumes;

    /**
     * This event gets invoked
     * when the flag gets clicked
     * 
     * @param fn the event body
     */
    whenFlag(fn: () => void): void;

    /**
     * This event gets invoked
     * after the engine is ready
     * 
     * @param fn the event body
     */
    whenLoaded(fn: () => void): void;

    /**
     * Clears the effects of the entity.
     */
    clearEffects(): void;

    /**
     * Pauses the current script
     */
    wait(seconds: number): void;

    /**
     * This event gets invoked when any key gets pressed
     * 
     * @param key keyword "any"
     * @param fn the event body
     */
    whenKeyPressed(key: "any", fn: () => void): void;

    /**
     * This event gets invoked when the key gets pressed
     * 
     * @param key the name of the Key
     * @param fn the event body
     */
    whenKeyPressed(key: Key, fn: () => void): void;

    /**
     * Function gets invoked when the mouse event occurs
     * @param event The type of the mouse event
     * @param fn This event
     */
    whenMouse(event: MouseEvent, fn: () => void): void;

    whenReceiveMessage(message: string, fn: () => void): void;
    broadcastMessage(message: string): void;
    broadcastMessageWait(message: string): void;

    /**
     * Switches the backdrop to the specified backdrop.
     * @param value Name or index of the backdrop
     */
    switchBackdropTo(value: number | string): void;
    /**
     * Switch to backdrop and wait for all listeners to finish executing.
     * Listeners are set by `whenBackdropChangesTo` method.
     * @param name Name of the backdrop
     */
    switchBackdropToWait(name: string): void;
    /**
     * Switch to the next backdrop
     */
    nextBackdrop(): void;

    /**
     * @param name The backdrop name to listen to
     * @param fn The event body
     */
    whenBackdropChangesTo(name: string, fn: () => void): void;
    playSound(name: string): void;
    playSoundUntilDone(name: string): void;
    stopSounds(): void;
    whenTimerElapsed(seconds: number, fn: () => void): void;
    getTimer(): number;
    resetTimer(): void;

    isKeyPressed(key: Key): boolean;
    isKeyPressed(key: "any"): boolean;
}

interface Sprite<Variables = {}> extends Stage<Variables & typeof $.Stage.variables> {
    isPenDown: boolean;
    penSize: number;
    penColor: Color;

    x: number;
    y: number;
    draggable: boolean;
    direction: number;
    visible: boolean;
    size: number;

    readonly costume: Costumes;

    delete(): void;
    clone(): this;

    whenCloned(fn: () => void): void;
    /**
     * Moves the sprite for the specified number of seconds so it arrives at specified location when time is up.
     * @param seconds time to glide
     * @param x the x coordinate to glide to
     * @param y the y coordinate to glide to
     * @returns a promise that resolves when the glide is done
     */
    glide(seconds: number, x: number, y: number): void;
    move(steps: number): void;
    goTo(x: number, y: number): void;
    goTowards(sprite: Sprite): void;
    pointInDirection(direction: number): void;
    pointTowards(sprite: Sprite): void;
    pointTo(x: number, y: number): void;
    turnLeft(degrees: number): void;
    turnRight(degrees: number): void;
    setRotationStyle(style: 0 | 1 | 2 | "left-right" | "don't rotate" | "all around"): void;
    ifOnEdgeBounce(): void;
    goForward(): void;
    goBackward(): void;
    goToFront(): void;
    goToBack(): void;

    switchCostumeTo(value: string | number): void;
    nextCostume(): void;

    show(): void;
    hide(): void;

    think(contents: any): void;
    say(contents: any): void;
    thinkWait(contents: any, seconds: number): void;
    sayWait(contents: any, seconds: number): void;
    ask(contents: any): string;
    penClear(): void;
    stamp(): void;
    penDown(): void;
    penUp(): void;

    distanceTo(x: number, y: number): number;
    isTouchingMouse(): boolean;
    isTouchingEdge(): boolean;
    isTouching(sprite: Sprite): boolean;

    isTouchingBackdropColor(): boolean;
}

interface Costumes {
    readonly all: string[];
    readonly name: string;
    readonly index: number;
}

declare type Color = string & {};
declare namespace Color {
    /**
     * Converts the hexadecimal color to a color object
     * @param hex Hexadecimal color in the format of #rrggbb
     */
    function fromHex(hex: string): Color;
    /**
     * Converts the white color to a color object
     * @param hex White color
     */
    function fromHex(hex: "#ffffff"): Color;
    /**
     * Converts the black color to a color object
     * @param hex Black color
     */
    function fromHex(hex: "#000000"): Color;
    /**
     * Converts the red color to a color object
     * @param hex Red color
     */
    function fromHex(hex: "#ff0000"): Color;
    /**
     * Converts the green color to a color object
     * @param hex Green color
     */
    function fromHex(hex: "#00ff00"): Color;
    /**
     * Converts the blue color to a color object
     * @param hex Blue color
     */
    function fromHex(hex: "#0000ff"): Color;
    /**
     * Converts the yellow color to a color object
     * @param hex Yellow color
     */
    function fromHex(hex: "#ffff00"): Color;
    /**
     * Converts the magenta color to a color object
     * @param hex Magenta color
     */
    function fromHex(hex: "#ff00ff"): Color;
    /**
     * Converts the cyan color to a color object
     * @param hex Cyan color
     */
    function fromHex(hex: "#00ffff"): Color;
    /**
     * Converts RGB color to a color object
     * @param r Red color 0-255
     * @param g Green color 0-255
     * @param b Blue color 0-255
     */
    function fromRGB(r: number, g: number, b: number): Color;
    /**
     * Generates a random color
     */
    function random(): Color;
}

declare type Key = "Enter" | "Escape" | "Space" | "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight" | "Shift" | "Ctrl" | "Alt" | "Backspace" | "Tab" | "Delete" | "CapsLock" | "F1" | "F2" | "F3" | "F4" | "F5" | "F6" | "F7" | "F8" | "F9" | "F10" | "F11" | "F12" | "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M" | "N" | "O" | "P" | "Q" | "R" | "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z" | "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m" | "n" | "o" | "p" | "q" | "r" | "s" | "t" | "u" | "v" | "w" | "x" | "y" | "z";
declare type MouseEvent = "clicked" | "pressed" | "released" | "left" | "entered" | "moved" | "double-clicked";

// For TypeScript to work
declare interface RegExp {}
declare interface Boolean {}
declare interface Object {}
declare interface Function {}
declare interface IArguments {}

// Scrap's primitives
declare interface Number {}
declare function Number(value: any): number;

declare interface String extends Iterable<string> {
    /**
     * Bracket notation finds a character by index;
     * indexes start at zero.
     */
    readonly [i: number]: string;
    /**
     * Makes a substring
     * @param start Zero-based index
     * @param end Zero-based index
     */
    slice(start: number, end: number): string;
}
declare function String(value: any): string;


// Scrap's iterables
declare interface Symbol {}
declare namespace Symbol {
    const iterator: unique symbol;
    type iterator = typeof iterator;
}

declare interface Iterable<T> {
    /**
     * Length describes the size of iterable.
     * It is immutable.
     * 
     * ```ts
     * const a = [4, "a", 6];
     * a.length == 3;
     * 
     * const b = "Hello";
     * b.length === 5;
     * ```
     */
    readonly length: number;
    /**
     * Bracket notation finds an element by index;
     * indexes start at zero.
     */
    [i: number]: T;
    /**
     * Checks if string / array includes substring / element
     * @param item 
     */
    includes(item: T): boolean;
    /**
     * Finds the zero-based index
     * Returns -1 if not found.
     */
    indexOf(item: T): number;

    [Symbol.iterator](): {
        next(): {
            value: T;
        };
    };
}

declare interface Array<T> extends Iterable<T> {
    /**
     * Joins the string represantation with the separator
     * 
     * ```ts
     * [3, [1, 2, "A"], "OK", new Date()].join(" - ") === "3 - 1,2,A - OK - 07-24-2050"
     * ```
     * 
     * @param separator A comma for example
     */
    join(separator: string): string;

    /**
     * Reverses the array and returns it.
     */
    reverse(): T[];
    /**
     * Makes a substring
     * @param start Zero-based index
     * @param end Zero-based index
     */
    slice(start: number, end: number): T[];
}

declare var Array: {
    /**
     * Single type array
     */
    new <T>(...items: T[]): T[];
    /**
     * Mixed type array
     */
    new <T extends any[]>(...items: T): T;
};

declare class Date {
    constructor(date?: string);

    getFullYear(): number;
    getMonth(): number;
    getDate(): number;
    getDay(): number;
    getHours(): number;
    getMinutes(): number;
    getSeconds(): number;
}

declare namespace Math {
    function random(): number;
    function floor(value: number): number;
    function ceil(value: number): number;
    function round(value: number): number;
    function abs(value: number): number;
    function sqrt(value: number): number;
    function sin(value: number): number;
    function cos(value: number): number;
    function tan(value: number): number;
    function asin(value: number): number;
    function acos(value: number): number;
    function atan(value: number): number;
    function log(value: number): number;
    function exp(value: number): number;
    function log10(value: number): number;
}

declare namespace window {
    function alert(message: string): void;
    function confirm(message: string): boolean;
    function prompt(message: string): string;
}

declare const Infinity: number;
declare const NaN: number;