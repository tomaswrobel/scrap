import type ts from "typescript";

export function tagToString(tag: ts.JSDocTagInfo): string {
	let tagLabel = `*@${tag.name}*`;
	if (tag.name === "param" && tag.text) {
		const [paramName, ...rest] = tag.text;
		tagLabel += `\`${paramName.text}\``;
		if (rest.length > 0) {
			tagLabel += ` — ${rest.map(r => r.text).join(" ")}`;
		}
	} else if (Array.isArray(tag.text)) {
		tagLabel += ` — ${tag.text.map(r => r.text).join(" ")}`;
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	} else if (tag.text) {
		tagLabel += ` — ${tag.text}`;
	}
	return tagLabel;
}
