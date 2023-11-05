export type Variable = [string, string | number, true?];
export type Input = [unknown, string];
export type Field = [string, string | null];

export interface Mutation {
    tagName: "mutation";
    children: [];
    proccode: string;
    argumentids: string;
    argumentnames: string;
    argumentdefaults: string;
    warp: `${boolean}`;
}

export interface Block {
    opcode: string;
    next: string | null;
    parent: string | null;
    inputs: Record<string, Input>;
    fields: Record<string, Field>;
    shadow: boolean;
    topLevel: boolean;
    mutation?: Mutation;
}

export interface Costume {
    name: string;
    dataFormat: "png" | "svg" | "jpg" | "bmp" | "gif";
    assetId: string;
}

export interface Sound {
    name: string;
    format: "wav" | "mp3" | "m4a" | "ogg";
    assetId: string;
}

export interface Target {
    name: string;
    variables: Record<string, Variable>;
    costumes: Costume[];
    sounds: Sound[];
}

export interface Stage extends Target {
    isStage: true;
}

export interface Sprite extends Target {
    isStage: false;
}

export interface Project {
    targets: (Stage | Sprite)[];
    extensions: string[];
}

export default Project;