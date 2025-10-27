/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @fileoverview Messages utility
 * @copyright Tomáš Wróbel 2025
 */
class Messages extends EventTarget {
	listeners: Messages.Listener[] = [];
}

declare namespace Messages {
	export interface Listener {
		msg: string;
		listenerId: string;
	}

	export type Event = CustomEvent<string>;

	export type DoneEvent = CustomEvent<{
		listenerId: string;
		msgId: string;
	}>;
}

export default Messages;
