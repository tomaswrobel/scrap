/**
 * Reference to the current sprite (stage)
 */
const self = $[__SPRITE__];

/**
 * Declare variables
 * accessible via `self.variables`
 */
interface Variables {}

/**
 * Sprite database
 * 
 * Example:
 * 
 * ```typescript
 * self.goTowards($["Scrappy"]);
 * ```
 */
declare const $: {__SPRITES__;};