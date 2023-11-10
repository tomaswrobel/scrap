declare module "*.svg" {
    const url: string;
    export default url;
}

declare interface Window {
    app: import("./app").default;
}