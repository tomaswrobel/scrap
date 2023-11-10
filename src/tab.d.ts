import {Entity} from "./entity";

export default interface TabComponent {
	render(parent: HTMLElement): void;
	update(): void;
	dispose(): void;
}
