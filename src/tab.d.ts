import {Entity} from "./entity";
import App from "./app";

export default interface TabComponent {
	/**
	 * The name of the tab
	 * It will be displayed in the tab bar
	 */
	name: string;
	/**
	 * Update is called when the selected entity is changed
	 * It can be also called by component itself
	 * within the {@link render} method
	 */
	update(): void;
	/**
	 * Dispose is called when the tab should be destroyed
	 */
	dispose(): void;
	/**
	 * Render is called when the tab should be created
	 */
	render(): void;
	/**
	 * Prerender is called before the tab is rendered
	 * It can be used to do some heavy work
	 * like compiling code or loading images.
	 * 
	 * If it throws an error, the tab will not be rendered
	 * 
	 * Usually, you should call {@link App.showLoader}
	 * before doing any heavy work and {@link App.hideLoader}
	 * after it is done
	 */
	prerender?(): Promise<void>;
}
