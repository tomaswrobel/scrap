export type Variable = [string, string | number, true?];
export type Input = [1 | 2, string | SimpleBlock];
export type Field = [string, string | null];

export type SimpleBlock =
    | [4, `${number}`]
    | [5, `${number}`]
    | [6, `${number}`]
    | [7, `${number}`]
    | [8, `${number}`]
    | [9, `#${string}`]
    | [10, string]
    | [11, string, string]
    | [12, string, string]
    | [13, string, string]
;

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
    dataFormat: "wav" | "mp3" | "m4a" | "ogg";
    assetId: string;
}

export interface Target {
    name: string;
    isStage: boolean;
    variables: Record<string, Variable>;
    lists: Record<string, unknown>;
    costumes: Costume[];
    currentCostume: number;
    sounds: Sound[];
    blocks: Record<string, Block>;
}

export interface Stage extends Target {
    name: "string";
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