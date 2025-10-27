/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @fileoverview Method type
 * @copyright Tomáš Wróbel 2025
 */
import type {SpreadParameters} from "./SpreadParameters";

export type Method<This, Args extends SpreadParameters, Return> = (
	this: This,
	...args: Args
) => Return;
