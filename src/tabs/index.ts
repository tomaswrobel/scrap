import TabComponent from "../tab";
import * as Parley from "parley.js";
import "./style.scss";

class Tabs {
    active?: TabComponent;
    root = document.getElementById("tabs")!;
    buttons: Record<string, HTMLButtonElement> = {};

    constructor(...components: [TabComponent, ...TabComponent[]]) {
        for (const component of components) {
            const button = document.createElement("button");
            button.type = "button";
            button.title = `${component.name} tab`;
            button.innerText = component.name;
            this.buttons[component.name] = button;
            button.onclick = () => {
                if (this.active === component) {
                    return;
                }
                this.set(component);
            };
            this.root.appendChild(button);
        }
        this.set(components[0]);
    }

    async set(component: TabComponent) {
        if (component === this.active) {
            component.update();
            return;
        }
        if (component.prerender && this.active) {
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

        this.active?.dispose();
        this.active = component;
        this.active.render();

        const selected = this.root.querySelector(".selected");

        if (selected) {
            selected.classList.remove("selected");
        }

        this.buttons[component.name].classList.add("selected");
    }
}

export default Tabs;