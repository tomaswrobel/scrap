import type Dialog from "./components/controls/Dialog.svelte";

export default class App {
	public dialog = $state<Dialog>({
		cancel() {
			// Dialog is not initialized.
		},
		close() {
			// Dialog is not initialized.
		},
		fire: () => Promise.resolve(false),
		isOpen: () => false,
	});
}
