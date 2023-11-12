declare module "*.svg" {
    const url: string;
    export default url;
}

declare interface Window {
    /**
     * Scrap App instance
     */
    app: import("./app").default;
}