/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @fileoverview Runtime
 * @copyright Tomáš Wróbel 2025
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
declare const $: {__SPRITES__};
type Backdrop = __BACKDROPS__;
