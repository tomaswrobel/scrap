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

import Dialog from "./dialog";

export interface Method<This, Args extends unknown[], Return> {
	(this: This, ...args: Args): Return;
}

export function bind<
	K extends string,
	A extends unknown[],
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

export function load<B extends boolean>(title: string, dialog?: B) {
	return function <
		K extends string,
		A extends unknown[],
		R extends B extends true ? string | HTMLElement : void,
		T extends Record<K, Method<T, A, Promise<R>>>
	>(
		target: T,
		key: K,
		descriptor: TypedPropertyDescriptor<Method<T, A, Promise<R>>>
	): TypedPropertyDescriptor<Method<T, A, Promise<R>>> {
		type S = Promise<string | HTMLElement>;

		return {
			configurable: true,
			async value(this: T, ...args: A) {
				if (dialog) {
					await Dialog.scrap.fire({
						input: "none",
						title,
						builder: () => descriptor.value!.apply(this, args) as S,
					});
				} else {
					const timeout = setTimeout(() => {
						document.body.dataset.loading = title;
					}, 200);

					const result = await descriptor.value!.apply(this, args);

					clearTimeout(timeout);
					document.body.removeAttribute("data-loading");

					return result;
				}

				return {} as R;
			},
		};
	};
}
