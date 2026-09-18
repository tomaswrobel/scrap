export interface EnumConstructor {
	make<const T extends Enum.Object>(object: T): Readonly<T>;

	keys<T extends Enum.Object>(enumObject: T): (keyof T)[];
	values<T extends Enum.Object>(enumObject: T): T[keyof T][];
	entries<T extends Enum.Object>(enumObject: T): {[K in keyof T]: [K, T[K]]}[keyof T][];
}

export declare namespace Enum {
	export type Object = Record<string, string> | Record<string, number>;
	export type Infer<T extends Enum.Object> = T[keyof T];
}

export const Enum: EnumConstructor = {
	make: Object.freeze,
	keys: Object.keys,
	values: Object.values,
	entries: Object.entries,
};
