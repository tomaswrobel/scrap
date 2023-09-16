import type App from "./app";
import {Entity} from "./entity";

export default interface TabComponent {
	render(entity: Entity, parent: HTMLElement): void;
	update(entity: Entity): void;
	dispose(): void;

	app: App;
}
