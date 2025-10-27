/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @fileoverview Custom events typings
 * @copyright Tomáš Wróbel 2025
 */
import type Messages from "./messages";
import type Sprite from "./sprite";

declare global {
	interface DocumentEventMap {
		ScrapMessageDone: Messages.DoneEvent;
		ScrapSpriteClone: CustomEvent<Sprite>;
	}
}
