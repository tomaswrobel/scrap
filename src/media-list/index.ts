import "./media-list.scss";

export class MediaList extends EventTarget {
    root = document.createElement("div");
    fab = document.createElement("label");

    constructor(
        readonly type: MediaType,
        readonly files: File[]
    ) {
        super();

        this.root.classList.add("media-list");
        this.root.style.gridArea = type.gridArea;

        this.fab.classList.add("fab");
        this.fab.textContent = "+";
        this.fab.style.gridArea = type.gridArea;

        const input = document.createElement("input");
        input.type = "file";
        input.accept = `${type.accept}`;

        input.multiple = true;
        input.style.display = "none";

        input.addEventListener("change", () => {
            if (input.files) {
                this.addFiles(input.files);
            }
        });

        // Drag and drop
        this.root.addEventListener("dragover", event => {
            event.preventDefault();
        });

        this.root.addEventListener("drop", event => {
            event.preventDefault();
            if (event.dataTransfer) {
                this.addFiles(event.dataTransfer.files);
            }
        });

        // Styling
		this.fab.style.lineHeight = "50px";
		this.fab.style.textAlign = "center";
		this.fab.style.font = "20px sans-serif bold";

        this.fab.appendChild(input);
    }

    render(parent: Element) {
        parent.append(this.root, this.fab);
        for (let i = 0; i < this.files.length; i++) {
            this.createMediaElement(this.files[i]);
        }

        const first = this.root.querySelector(".media-element");
        if (first) {
            first.classList.add("selected");
        }
    }

    addFiles(files: Iterable<File>) {
        for (const file of files) {
            if (this.type.accept.indexOf(file.type) !== -1) {
                this.files.push(file);
                this.createMediaElement(file);
            }
        }
    }

    createMediaElement(file: File) {
        const element = document.createElement("div");
        element.classList.add("media-element");

        const img = new Image();
        img.src = this.type.getURLFor(file);
        element.appendChild(img);

        const name = document.createElement("span");
        name.title = file.name;
        name.classList.add("name");
        name.textContent = file.name;
        element.appendChild(name);

        element.onclick = () => {
            for (const child of this.root.getElementsByClassName("selected")) {
                child.classList.remove("selected");
            }

            element.classList.add("selected");
            
            this.dispatchEvent(new CustomEvent("select", {
                detail: file
            }));
        };

        this.root.appendChild(element);
    }

    dispose() {
        this.root.innerHTML = "";
        this.root.remove();
        this.fab.remove();
    }

    static readonly COSTUME: MediaType = {
        getURLFor(file: File) {
            return URL.createObjectURL(file);
        },
        accept: [
            "image/png",
            "image/jpeg",
            "image/svg+xml"
        ],
        gridArea: "costume"
    };

    static readonly SOUND: MediaType = {
        getURLFor(_file: File) {
            return require("./note.svg");
        },
        accept: [
            "audio/mpeg",
            "audio/ogg",
            "audio/wav",
        ],
        gridArea: "sound"
    }
}

export interface MediaType {
    getURLFor(file: File): string;
    accept: string[];
    gridArea: string;
}