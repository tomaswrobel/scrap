/**
 * This file is a part of Scrap, an educational programming language.
 * You should have received a copy of the MIT License, if not, please 
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap. 
 * 
 * @license MIT
 * @author Tomáš Wróbel
 */
import TabComponent from "./tab";
import type Tabs from "./tabs";
import "./hidden.scss";

/**
 * Hidden tab component is displayed when the 
 * user resizes the output. That's because 
 * both Blockly and Monaco editors cannot
 * adjust their size to the grid after
 * they are rendered.
 */
export class Hidden implements TabComponent {
    container!: HTMLDivElement;
    name = 'Hidden';

    update() {
        const {width, height} = app.getOutputSize();
        this.container.dataset.size = `${width}x${height}`;
    }

    dispose() {
        this.container.remove();
    }

    render() {
        app.container.appendChild(this.container);
    }

    constructor(readonly previous: TabComponent) {
        if (previous instanceof Hidden) {
            return previous;
        }

        this.name = previous.name;
        this.container = document.createElement("div");

        this.container.classList.add(
            "tab-content",
            "hidden-content"
        );
    }
}

export class Visibility {
    constructor(private readonly tabs: Tabs) {}

    /**
     * Hide the active tab, show {@link Hidden placeholder}
     * Do not forget to call {@link show}.     
     */
    hide() {
        if (this.tabs.active) {
            this.tabs.set(new Hidden(this.tabs.active));
        }
    }

    /**
     * Show the active tab, hide {@link Hidden placeholder}
     * This must be done after {@link hide} is called.
     */
    show() {
        if (this.tabs.active instanceof Hidden) {
            this.tabs.set(this.tabs.active.previous);
        }
    }
}