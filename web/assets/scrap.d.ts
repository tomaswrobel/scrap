/**
 * Reference to the current sprite (stage)
 */
declare const self: Sprite;

/**
 * Sprite database
 *
 * Example:
 *
 * ```typescript
 * self.goTowards($["Scrappy"]);
 * ```
 */
declare const $: {
	[x: string]: Sprite;
} & {
	Stage: Stage;
};

declare type Backdrop = never;
