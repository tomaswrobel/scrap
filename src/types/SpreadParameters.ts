/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap.
 *
 * @license MIT
 * @fileoverview Type that every Parameters<?> type satisfies
 * @copyright Tomáš Wróbel 2025
 */
/**
 * Type that every `Parameters<?>` type satisfies.
 *
 * ```ts
 * declare function array<T extends SpreadParameters>(...array: T): T;
 * ```
 */
export type SpreadParameters = [] | any[];
