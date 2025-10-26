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
