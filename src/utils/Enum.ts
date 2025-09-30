export interface EnumConstructor {
	new <const T extends Enum.Object>(object: T): T;

	keys<T extends Enum.Object>(enumObject: T): (keyof T)[];
	values<T extends Enum.Object>(enumObject: T): T[keyof T][];
	entries<T extends Enum.Object>(enumObject: T): {[K in keyof T]: [K, T[K]]}[keyof T][];
}

export declare namespace Enum {
	type Object = Record<string, string> | Record<string, number>;
	type Infer<T extends Enum.Object> = T[keyof T];
}

export const Enum = Object as EnumConstructor;

