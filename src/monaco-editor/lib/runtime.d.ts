/**
 * This file is a part of Scrap, an educational programming language.
 * You should have received a copy of the MIT License, if not, please 
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap. 
 * 
 * @license MIT
 * @author Tomáš Wróbel
 * @fileoverview Runtime library for Scrap.
 * 
 * This file defines necessary runtime for TypeScript to succeed in
 * compiling the Scrap code. All the types get replaced with actual
 * values at Scrap runtime, see `src/code/lib/runtime.ts` for more info.
 */

/**
 * Reference to the current sprite (stage)
 */
declare const self: Stage<{}>;

/**
 * Sprite database
 * 
 * Example:
 * 
 * ```typescript
 * self.goTowards($["Scrappy"]);
 * ```
 */
declare const $: {
    [x: string]: Sprite<{}>;
} & {
    Stage: Stage<{}>;
};

declare type Backdrop = never;