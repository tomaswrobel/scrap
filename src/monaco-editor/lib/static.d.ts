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
     * 0-100
     */
    volume: number;

    readonly variables: Variables;
    readonly mouseX: number;
    readonly mouseY: number;
    readonly mouseDown: boolean;
    readonly backdrop: Costumes;

    /**
     * The callback gets invoked
     * when the flag gets clicked
     * 
     * @param fn the callback
     */
    whenFlag(fn: () => void): void;

    /**
     * The callback gets invoked
     * after the engine is ready
     * 
     * @param fn the callback
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
     * The callback gets invoked when any key gets pressed
     * 
     * @param key keyword "any"
     * @param fn the callback
     */
    whenKeyPressed(key: "any", fn: () => void): void;

    /**
     * The callback gets invoked when the key gets pressed
     * 
     * @param key the name of the Key
     * @param fn the callback
     */
    whenKeyPressed(key: Key, fn: () => void): void;
    whenMouse(event: MouseEvent, fn: () => void): void;
    whenReceiveMessage(message: string, fn: () => void): void;
    whenTimerElapsed(seconds: number, fn: () => void): void;

    broadcastMessage(message: string): void;
    broadcastMessageWait(message: string): void;

    /**
     * Switches the backdrop to the specified backdrop.
     * @param value Name or index of the backdrop
     * @returns the id of the listeners
     */
    switchBackdropTo(value: number | string): void;
    /**
     * Switch to backdrop and wait for all listeners to finish executing.
     * @param name Name of the backdrop
     * @returns a promise that resolves when all listeners have finished executing
     */
    switchBackdropToWait(name: string): void;
    nextBackdrop(): void;

    whenBackdropChangesTo(name: string, fn: () => void): void;
    playSound(name: string): void;
    playSoundUntilDone(name: string): void;
    getTimer(): number;
    resetTimer(): void;
}

interface Sprite<Variables = {}> extends Stage<Variables> {
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

    think(contents: unknown): void;
    say(contents: unknown): void;
    thinkWait(contents: unknown, seconds: number): void;
    sayWait(contents: unknown, seconds: number): void;
    ask(contents: unknown): string;
    penClear(): void;
    stamp(): void;
    penDown(): void;
    penUp(): void;

    distanceTo(x: number, y: number): number;
    isTouchingMouse(): boolean;
    isTouchingEdge(): boolean;
    isTouching(sprite: Sprite): void;

    isTouchingBackdropColor(): boolean;
    isKeyPressed(key: Key): boolean;
    isKeyPressed(key: "any"): boolean;
}

interface Costumes {
    readonly all: string[];
    readonly name: string;
    readonly index: number;
}

declare type Color = string;
declare namespace Color {
    function fromHex(hex: string): Color;
    function fromRGB(r: number, g: number, b: number): Color;
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
declare function Number(value: unknown): number;

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
declare function String(value: unknown): string;


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