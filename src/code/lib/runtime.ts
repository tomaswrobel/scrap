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
 * This file, including this comment, serves as a definition of the
 * TypeScript runtime. For example, it defines `self`. For this to 
 * work, it uses templates (see `src/code/lib/templates.d.ts`). 
 * Templates get replaced with actual values during the process of 
 * building Monaco editor's language service.
 */
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
type Backdrop = __BACKDROPS__;