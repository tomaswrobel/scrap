import type * as Blockly from "blockly";
export const Types = ["", "number", "string", "boolean", "Color", "Array", "Sprite", "Date"];
export const Error = `Type must be one of void${Types.join(", ")}`;

export const TypeToShadow: Record<string, string> = {
	number: "math_number",
	string: "iterables_string",
	Color: "color",
	Sprite: "sprite",
	Date: "date",
	any: "text_or_number"
};

export function toCheck(block?: Blockly.Block | null): app.Check {
	if (!block) {
		return "any";
	}
	if (block.type === "type") {
		return block.getFieldValue("TYPE");
	}
	if (block.type === "union") {
		const set = new Set(
			block.inputList.reduce(
				(previous, current) => previous.concat(
					toCheck(current!.connection!.targetBlock())
				),
				[] as string[]
			)
		);

		if (set.size === 1) {
			return set.values().next().value;
		}

		return [...set];
	}
	if (block.type === "typed") {
		return toCheck(block.getInput("TYPE")?.connection?.targetBlock());
	}
	if (block.type === "generic") {
		return block.getFieldValue("ITERABLE");
	}
	return "any";
}