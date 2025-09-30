import type Messages from "./messages";
import type Sprite from "./sprite";

declare global {
	interface DocumentEventMap {
		ScrapMessageDone: Messages.DoneEvent;
		ScrapSpriteClone: CustomEvent<Sprite>;
	}
}
