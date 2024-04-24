// Overriden by IDE

declare const self: Stage<{}>;
declare const $: {
    [x: string]: Sprite<{}>;
} & {
    Stage: Stage<{}>;
};

type Backdrop = never;