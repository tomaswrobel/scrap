/**
 * This file is a part of Scrap Native, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @fileoverview Bind decorator
 * @author Ivo Stratev
 *
 * @license MIT
 * @fileoverview App loader decorator
 * @author Tomáš Wróbel
 */

export interface Method<This, Args extends any[], Return> {
	(this: This, ...args: Args): Return;
}

export function bind<
	K extends string,
	A extends any[],
	R,
	T extends Record<K, Method<T, A, R>>
>(
	_target: T,
	key: K,
	descriptor: TypedPropertyDescriptor<Method<T, A, R>>
): TypedPropertyDescriptor<Method<T, A, R>> {
	return {
		configurable: true,
		get(this: T) {
			const bound = descriptor.value!.bind(this);
			Object.defineProperty(this, key, {
				value: bound,
				configurable: true,
				writable: true,
			});
			return bound;
		},
	};
}

export function load(reason: string) {
	return function <
		K extends string,
		A extends any[],
		R,
		T extends Record<K, Method<T, A, Promise<R>>>
	>(
		_target: T,
		_key: K,
		descriptor: TypedPropertyDescriptor<Method<T, A, Promise<R>>>
	): TypedPropertyDescriptor<Method<T, A, Promise<R>>> {
		return {
			configurable: true,
			async value(this: T, ...args: A) {
				const timeout = setTimeout(() => {
					document.body.dataset.loading = reason;
				}, 200);

				const result = await descriptor.value!.call(this, ...args);

				clearTimeout(timeout);
				document.body.removeAttribute("data-loading");

				return result;
			},
		};
	};
}
