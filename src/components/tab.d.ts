/**
 * This file is a part of Scrap, an educational programming language.
 * You should have received a copy of the MIT License, if not, please 
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap. 
 * 
 * @license MIT
 * @author Tomáš Wróbel
 * @fileoverview Tab component interface.
 */
import {App} from "../app";
import Tabs from "./tabs";

/**
 * TabComponent is an interface for creating new tabs.
 * These tabs are displayed in the tab bar and can be selected
 * by the user. See {@link Tabs} for the management of tabs.
 */
export default interface TabComponent {
	/**
	 * The container of the tab
	 * must have the class "tab-content"
	 */
	container: HTMLDivElement;
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
