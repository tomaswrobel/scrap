type JSONPrimitiveValue = string | number | boolean | null | undefined | JSONPrimitiveValue[];

interface JSONObjectValue {
	[x: string]: JSONPrimitiveValue | JSONObjectValue;
}

export type JSONValue = JSONPrimitiveValue | JSONObjectValue;
