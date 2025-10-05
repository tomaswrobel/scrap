import type Dialog from "./components/controls/Dialog.svelte";

export interface App {
	dialog: Dialog;
}

export const app = $state<App>({
	dialog: {
		cancel() {
			// Dialog is not initialized.
		},
		close() {
			// Dialog is not initialized.
		},
		fire: () => Promise.resolve(false),
		isOpen: () => false,
	},
});
