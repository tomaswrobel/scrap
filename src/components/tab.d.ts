import {Entity} from "./entity";

export default interface TabComponent {
	render(entity: Entity, parent: HTMLElement): void;
	update(entity: Entity): void;
	dispose(other: Entity[]): void;
}
