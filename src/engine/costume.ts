export default class Costume {
	public width = 0;
	public height = 0;
	public readonly src: string;

	constructor(src: string) {
		this.src = src;
	}

	public async load() {
		const img = new Image();
		img.src = this.src;

		if (!img.complete) {
			await new Promise(resolve => {
				img.addEventListener("load", resolve, { once: true });
			});
		}

		this.width = img.width;
		this.height = img.height;
	}
}
