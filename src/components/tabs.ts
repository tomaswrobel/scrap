import {Visibility, type Hidden} from "./visibility";
import TabComponent from "./tab";
import * as Parley from "parley.js";
import "./tabs.scss";

export default class Tabs {
    active: TabComponent;
    root = document.getElementById("tabs")!;
    buttons: Record<string, HTMLButtonElement> = {};

    /**
     * Create a new tab bar.
     * 
     * @param components The components to be displayed in the tab bar. At least one component is required.
     */
    constructor(...components: [TabComponent, ...TabComponent[]]) {
        for (let i = 0; i < components.length; i++) {
            const button = document.createElement("button");
            button.onclick = this.click(components[i]);
            const {name} = components[i];
            button.type = "button";
            button.title = `${name} tab`;
            button.innerText = name;
            this.buttons[name] = button;
            this.root.appendChild(button);
        }

        this.active = components[0];
        this.active.render();
        this.buttons[this.active.name].classList.add("selected");
    }

    async set(component: TabComponent) {
        if (component === this.active) {
            component.update();
            return;
        }

        if (component.prerender) {
            try {
                await component.prerender();
            } catch (error) {
                console.error(error);
                app.hideLoader();
                await new Promise(resolve => setTimeout(resolve, 100));
                await Parley.fire({
                    title: "Error",
                    body: String(error),
                    input: "none"
                });
                return;
            }
        }

        this.active.dispose();
        this.active = component;
        this.active.render();

        this.root.querySelector(".selected")?.classList.remove("selected");
        this.buttons[component.name].classList.add("selected");
    }

    private click(component: TabComponent) {
        return () => {
            if (this.active === component) {
                return;
            }

            this.set(component);
        };
    }

    /**
     * Effects currently do this:
     * 
     * - Hide the active tab, show {@link Hidden placeholder}
     * - Restore the active tab
     */
    public readonly effects = new Visibility(this);
}