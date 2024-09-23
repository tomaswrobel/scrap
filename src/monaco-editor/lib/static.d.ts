/**
 * This file is a part of Scrap, an educational programming language.
 * You should have received a copy of the MIT License, if not, please 
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap. 
 * 
 * @license MIT
 * @author Tomáš Wróbel
 * @fileoverview Scrap Engine's static types.
 * 
 * This file, including this comment, serves as a definition of the
 * TypeScript statically known types. 
 */

/**
 * Namespace for the functionality
 * handled by the Scrap engine
 * and not by individual sprites.
 */
declare const Scrap: {
    /**
     * Stops the project
     */
    stop(): void;

    /**
     * Detects if project
     * runs in turbo mode
     */
    readonly isTurbo: boolean;
};

interface Stage<Variables = {}, Sound = string> {
    /**
     * Graphical effects
     */
    readonly effects: {
        /**
         * Brightness of the sprite
         * 0 - totally dark (black)
         * 100 - normal
         */
        brightness: number,
        color: number,
        /**
         * Transparency of the sprite
         * 0 - visible
         * 100 - invisible
         */
        ghost: number,
        /**
         * Grayscale of the sprite
         * 0 - normal
         * 100 - grayscale
         * Note: Scrappy is almost in grayscale by default.
         */
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
     * Hides the variable from the stage
     * @param name The name of the variable
     */
    hideVariable(name: keyof Variables): void;

    /**
     * Shows the variable on the stage
     * @param name The name of the variable
     */
    showVariable(name: keyof Variables): void;

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
    readonly backdrop: Costumes<Backdrop>;

    /**
     * This event gets invoked when the sprite / stage is loaded
     * @param fn the event body
     */
    whenLoaded(fn: () => void): void;

    /**
     * This event gets invoked
     * when the flag gets clicked
     * 
     * @param fn the event body
     */
    whenFlag(fn: () => void): void;

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
     * @param key the name of the key
     * @param fn the event body
     */
    whenKeyPressed(key: Key, fn: () => void): void;

    // Because "Key" is not a valid type,
    // we need to use the string type instead.
    /**
     * This event gets invoked when the key gets pressed
     * 
     * @param key the name of the key
     * @param fn the event body
     */
    whenKeyPressed(key: string, fn: () => void): void;

    /**
     * Function gets invoked when the mouse event occurs
     * @param event The type of the mouse event
     * @param fn the event body
     */
    whenMouse(event: MouseEvent, fn: () => void): void;

    // Because "MouseEvent" is not a valid type,
    // we need to use the string type instead.
    /**
     * Function gets invoked when the mouse event occurs
     * @param event The type of the mouse event
     * @param fn the event body
     */
    whenMouse(event: string, fn: () => void): void;

    /**
     * When any of sprites, or the stage broadcasts 
     * the message, the function gets invoked.
     * @param message The message to listen to
     * @param fn the event body
     */
    whenReceiveMessage(message: string, fn: () => void): void;

    /**
     * After the specified seconds since the start of the project,
     * the function gets invoked.
     * @param seconds Number of seconds
     * @param fn the event body
     */
    whenTimerElapsed(seconds: number, fn: () => void): void;

    /**
     * Broadcasts the message to all sprites and the stage
     * @param message The message to broadcast
     */
    broadcastMessage(message: string): void;

    /**
     * Broadcasts the message to all sprites and the stage
     * and waits for all of them to finish their job.
     * @param message The message to broadcast
     */
    broadcastMessageWait(message: string): void;

    /**
     * Switches the backdrop to the specified backdrop.
     * @param value Index of the backdrop (0-based)
     */
    switchBackdropTo(value: number): void;

    /**
     * Switches the backdrop to the specified backdrop.
     * @param value Name of the backdrop
     */
    switchBackdropTo(value: Backdrop): void;

    // Because "Backdrop" is not a valid type,
    // we need to use the string type instead.
    /**
     * Switches the backdrop to the specified backdrop.
     * @param value Name of the backdrop
     */
    switchBackdropTo(value: string): void;

    /**
     * Switch to backdrop and wait for all listeners to finish executing.
     * Listeners are set by `whenBackdropChangesTo` method.
     * @param name Name of the backdrop
     */
    switchBackdropToWait(name: Backdrop): void;

    // Because "Backdrop" is not a valid type,
    // we need to use the string type instead.
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
    whenBackdropChangesTo(name: Backdrop, fn: () => void): void;

    // Because "Backdrop" is not a valid type,
    // we need to use the string type instead.
    /**
     * @param name The backdrop name to listen to
     * @param fn The event body
     */
    whenBackdropChangesTo(name: string, fn: () => void): void;

    /**
     * Starts the sound
     * @param name The sound name
     */
    playSound(name: Sound): void;

    /**
     * Plays the sound until it finishes
     * @param name The sound name
     */
    playSoundUntilDone(name: Sound): void;

    /**
     * Stops all sounds
     */
    stopSounds(): void;

    /**
     * Gets the current time in seconds
     */
    getTimer(): number;

    /**
     * Resets the timer to 0
     */
    resetTimer(): void;

    /**
     * Is the key pressed?
     * @param key The key to check
     */
    isKeyPressed(key: Key): boolean;

    /**
     * Is any key pressed?
     * @param key The keyword "any"
     */
    isKeyPressed(key: "any"): boolean;

    // Because "Key" is not a valid type,
    // we need to use the string type instead.
    /**
     * Is the key pressed?
     * @param key The key to check
     */
    isKeyPressed(key: string): boolean;

    /**
     * Describes the width of the stage / sprite in pixels.
     * 
     * Note:
     * * The width of the stage is width of the frame / window.
     * * The width of the sprite is the width of the costume.
     */
    readonly width: number;

    /**
     * Describes the height of the stage / sprite in pixels.
     * 
     * Note:
     * * The height of the stage is height of the frame / window.
     * * The height of the sprite is the height of the costume.
     */
    readonly height: number;
}

interface Sprite<Variables = {}, Sound = string, Costume = string> extends Stage<Variables & typeof $.Stage.variables, Sound> {
    /**
     * If the pen is down, sprite draws lines when it moves.
     */
    isPenDown: boolean;

    /**
     * The width of the lines drawn by the sprite in pixels.
     */
    penSize: number;

    /**
     * The color of the lines drawn by the sprite.
     */
    penColor: Color;

    /**
     * The horizontal position of the sprite.
     * 0 is the center of the stage.
     */
    x: number;

    /**
     * The vertical position of the sprite.
     * 0 is the center of the stage.
     */
    y: number;

    /**
     * Can be dragged by the mouse?
     */
    draggable: boolean;

    /**
     * The direction the sprite is facing in degrees.
     */
    direction: number;

    /**
     * If the sprite is visible.
     */
    visible: boolean;

    /**
     * The size of the sprite, where 100 is the original size.
     */
    size: number;

    /**
     * Namespace for the costumes
     */
    readonly costume: Costumes<Costume>;

    /**
     * Deletes the sprite (or clone)
     */
    delete(): void;

    /**
     * Clones the sprite
     */
    clone(): this;

    /**
     * Clones the sprite and executes the function. {@link self} is bound 
     * to the new sprite, meaning {@link delete} will delete the clone.
     * @param fn The function to execute when the sprite is cloned
     */
    whenCloned(fn: () => void): void;

    /**
     * Moves the sprite for the specified number of seconds so it arrives at specified location when time is up.
     * @param seconds time to glide
     * @param x the x coordinate to glide to
     * @param y the y coordinate to glide to
     */
    glide(seconds: number, x: number, y: number): void;

    /**
     * Moves the sprite in the direction it is facing by the specified number of steps.
     * @param steps Number of steps to move in pixels
     */
    move(steps: number): void;

    /**
     * Goes to the specified location without animation.
     * @param x the x coordinate to go to (0 is the center of the stage)
     * @param y the y coordinate to go to (0 is the center of the stage)
     */
    goTo(x: number, y: number): void;

    /**
     * Goes to the same location as the specified sprite.
     * @param sprite other sprite
     */
    goTowards(sprite: Sprite): void;

    /**
     * Points the sprite in the specified direction.
     * @param direction The direction in degrees
     */
    pointInDirection(direction: number): void;

    /**
     * Points the sprite towards the specified sprite.
     * @param sprite The sprite to point towards
     */
    pointTowards(sprite: Sprite): void;

    /**
     * Points the sprite towards the specified location.
     * @param x the x coordinate to point towards
     * @param y the y coordinate to point towards
     */
    pointTo(x: number, y: number): void;

    /**
     * Turns the sprite to the left by the specified number of degrees.
     * @param degrees The number of degrees to turn
     */
    turnLeft(degrees: number): void;

    /**
     * Turns the sprite to the right by the specified number of degrees.
     * @param degrees The number of degrees to turn
     */
    turnRight(degrees: number): void;

    /**
     * Sets the rotation style of the sprite. It is visible only when the sprite is rotated.
     * @param style 0: don't rotate, 1: left-right, 2: all around
     */
    setRotationStyle(style: 0 | 1 | 2 | "left-right" | "don't rotate" | "all around"): void;

    /**
     * If I am touching the edge, I bounce.
     */
    ifOnEdgeBounce(): void;

    /**
     * Go one layer forward. (In front of other sprites)
     */
    goForward(): void;

    /**
     * Go one layer backward. (Behind other sprites)
     */
    goBackward(): void;

    /**
     * Go to the front layer. (In front of other sprites)
     */
    goToFront(): void;

    /**
     * Go to the back layer. (Behind other sprites)
     */
    goToBack(): void;

    /**
     * Switches the costume to the specified index.
     * @param value Index of the costume (0-based)
     */
    switchCostumeTo(value: number): void;

    /**
     * Switches the costume to the specified costume.
     * @param value Name of the costume
     */
    switchCostumeTo(value: Costume): void;

    // Because "Costume" is not a valid type,
    // we need to use the string type instead.
    /**
     * Switches the costume to the specified costume.
     * @param value Name of the costume
     */
    switchCostumeTo(value: string): void;

    /**
     * Switch to the next costume
     */
    nextCostume(): void;

    show(): void;
    hide(): void;

    /**
     * Shows the content in the sprite's speech bubble. The bubble looks like a cloud.
     * @param contents The content to show. Might be string, number, boolean, or any other type.
     */
    think(contents: any): void;

    /**
     * Shows the content in the sprite's speech bubble.
     * @param contents The content to show. Might be string, number, boolean, or any other type.
     */
    say(contents: any): void;

    /**
     * Shows the content in the sprite's speech bubble and waits for the specified number of seconds.
     * @param contents The content to show. Might be string, number, boolean, or any other type.
     * @param seconds The number of seconds to wait
     */
    thinkWait(contents: any, seconds: number): void;

    /**
     * Shows the content in the sprite's speech bubble and waits for the specified number of seconds.
     * @param contents The content to show. Might be string, number, boolean, or any other type.
     * @param seconds The number of seconds to wait
     */
    sayWait(contents: any, seconds: number): void;

    /**
     * Shows the content in the sprite's speech bubble and waits for the user to type the answer.
     * @param contents The content to show. Might be string, number, boolean, or any other type.
     * @returns The answer typed by the user
     */
    ask(contents: any): string;

    /**
     * Clears lines drawn by all sprites (and stamps).
     */
    penClear(): void;

    /**
     * Draws the current sprite as a stamp.
     * Stamps are not affected by the pen size or color.
     * Also, stamps are not sprites, so they cannot be interacted with.
     */
    stamp(): void;

    /**
     * Puts the pen down, so the sprite draws lines when it moves.
     */
    penDown(): void;

    /**
     * Lifts the pen up, so the sprite stops drawing lines when it moves.
     */
    penUp(): void;

    /**
     * Counts the distance to the specified location.
     * @param x the x coordinate to measure the distance to
     * @param y the y coordinate to measure the distance to
     */
    distanceTo(x: number, y: number): number;

    /**
     * Am I touching the mouse pointer?
     */
    isTouchingMouse(): boolean;

    /**
     * Am I touching the edge?
     */
    isTouchingEdge(): boolean;

    /**
     * Am I touching the specified sprite?
     * @param sprite The sprite to check if touching
     */
    isTouching(sprite: Sprite): boolean;

    /**
     * Am I touching the specified color?
     */
    isTouchingBackdropColor(): boolean;
}

interface Costumes<K> {
    /**
     * Returns all the asset names
     */
    readonly all: K[];

    /**
     * Returns the name of the current asset
     */
    readonly name: K;

    /**
     * Returns the index of the current asset
     */
    readonly index: number;
}

/**
 * Color is a basic Scrap type representing a color.
 * It is interchangeable with a string, but some 
 * methods may require a color object.
 */
declare type Color = (string & {}) | `#${string}`;

/**
 * Color namespace allows you to inistantiate colors.
 */
declare const Color: {
    /**
     * Converts the hexadecimal color to a color object
     * @param hex Hexadecimal color in the format of #rrggbb
     */
    fromHex(hex: `#${string}`): Color;
    /**
     * Converts the white color to a color object
     * @param hex White color
     */
    fromHex(hex: "#ffffff"): Color;
    /**
     * Converts the black color to a color object
     * @param hex Black color
     */
    fromHex(hex: "#000000"): Color;
    /**
     * Converts the red color to a color object
     * @param hex Red color
     */
    fromHex(hex: "#ff0000"): Color;
    /**
     * Converts the green color to a color object
     * @param hex Green color
     */
    fromHex(hex: "#00ff00"): Color;
    /**
     * Converts the blue color to a color object
     * @param hex Blue color
     */
    fromHex(hex: "#0000ff"): Color;
    /**
     * Converts the yellow color to a color object
     * @param hex Yellow color
     */
    fromHex(hex: "#ffff00"): Color;
    /**
     * Converts the magenta color to a color object
     * @param hex Magenta color
     */
    fromHex(hex: "#ff00ff"): Color;
    /**
     * Converts the cyan color to a color object
     * @param hex Cyan color
     */
    fromHex(hex: "#00ffff"): Color;
    /**
     * Converts RGB color to a color object
     * @param r Red color 0-255
     * @param g Green color 0-255
     * @param b Blue color 0-255
     */
    fromRGB(r: number, g: number, b: number): Color;
    /**
     * Generates a random color
     */
    random(): Color;
};

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

/**
 * Converts the value to a number
 * @param value any value
 */
declare function Number(value: any): number;

/**
 * True is converted to 1
 */
declare function Number(value: true): 1;

/**
 * False is converted to 0
 */
declare function Number(value: false): 0;

/**
 * Converts the value to a number
 * @param value True is converted to 1, false to 0
 */
declare function Number(value: boolean): 0 | 1;

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

/**
 * Converts the value to a string
 * @param value any value
 */
declare function String<const T>(value: T): T extends number | boolean | string ? `${T}` : string;


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

declare interface Array<T = any> extends Iterable<T> {
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

declare const Array: {
    /**
     * Single type array
     */
    new <T>(...items: T[]): T[];
    /**
     * Fixed-sized & Mixed type array - automatically infers the type
     * 
     * If you want to specify the type, use `new Array<T>(...)`
     * ```ts
     * const a = Array(3, "a", 6); // a: [3, "a", 6]
     * const b = Array<number | string>(3, "a", 6); // b: (number | string)[]
     * ```
     */
    new <const T extends any[]>(...items: T): T;
};

declare interface Date {
    /**
     * Returns the year of the specified date according to local time.
     */
    getFullYear(): number;

    /**
     * Returns the month of the specified date according to local time.
     */
    getMonth(): number;

    /**
     * Returns the day of the month for the specified date according to local time.
     */
    getDate(): number;

    /**
     * Returns the day of the week for the specified date according to local time.
     */
    getDay(): number;

    /**
     * Returns the hour for the specified date according to local time.
     */
    getHours(): number;

    /**
     * Returns the minutes in the specified date according to local time.
     */
    getMinutes(): number;

    /**
     * Returns the seconds in the specified date according to local time.
     */
    getSeconds(): number;
}

declare const Date: {
    /**
     * Creates a new date object,
     * representing the specified date and time
     * @param date date string
     */
    new(date: string): Date;

    /**
     * Creates a new date object,
     * representing the current date and time
     */
    new(): Date;
};

declare const Math: {
    /**
     * Returns a random number between 0 (inclusive) and 1 (exclusive)
     */
    random(): number;

    /**
     * Returns the smallest integer greater than or equal to a number
     */
    floor(value: number): number;

    /**
     * Returns the largest integer less than or equal to a number
     */
    ceil(value: number): number;

    /**
     * Returns the value of a number rounded to the nearest integer
     */
    round(value: number): number;

    /**
     * Returns the absolute value of a number
     * |x| = x if x > 0
     * |x| = -x if x < 0
     * |0| = 0
     */
    abs(value: number): number;

    /**
     * Returns the square root of a number
     */
    sqrt(value: number): number;

    /**
     * Returns the value of x to the power of y
     */
    sin(value: number): number;

    /**
     * Returns the value of x to the power of y
     */
    cos(value: number): number;

    /**
     * Returns the value of x to the power of y
     */
    tan(value: number): number;

    /**
     * Returns the value of x to the power of y
     */
    asin(value: number): number;

    /**
     * Returns the value of x to the power of y
     */
    acos(value: number): number;

    /**
     * Returns the value of x to the power of y
     */
    atan(value: number): number;

    /**
     * Returns the value of x to the power of y
     */
    log(value: number): number;

    /**
     * Returns the value of x to the power of y
     */
    exp(value: number): number;

    /**
     * Returns the value of x to the power of y
     */
    log10(value: number): number;
};

declare const window: {
    /**
     * Displays the native alert dialog with the specified message.
     * @param message the message to display
     */
    alert(message: string): void;

    /**
     * Displays the native confirm dialog with the specified message.
     * @param message the message to display
     */
    confirm(message: string): boolean;

    /**
     * 
     * @param message the message to display
     */
    prompt(message: string): string;
};

declare const Infinity: number;
declare const NaN: number;