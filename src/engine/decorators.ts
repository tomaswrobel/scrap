/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @fileoverview Common Entity's decorators
 * @copyright Tomáš Wróbel 2025
 */
import type {SpreadParameters} from "@juvofy/lib/utils/SpreadParameters";
import Entity from "./entity";
import {StopError} from "./utils";

/**
 * This decorator is used to decorate methods of the Entity class,
 * which should be used directly by the user. The execution of the
 * method is delayed by 33 ms, just like in the Scratch project.
 * @param method The method to decorate.
 * @param _context The context of the method.
 * @returns Decorated method.
 */
export function paced<A extends SpreadParameters, T, E extends Entity>(
	fn: (this: E, ...args: A) => Promise<T>,
	_context: ClassMethodDecoratorContext<E, typeof fn>,
) {
	return async function (this: E, ...args: A) {
		return new Promise<T>((resolve, reject) => {
			const controller = new AbortController();

			const timeout = window.setTimeout(() => {
				controller.abort();
				resolve(fn.apply(this, args));
			}, this.pace);

			window.addEventListener(
				"message",
				e => {
					if (e.data === "STOP") {
						window.clearTimeout(timeout);
						reject(new StopError());
					}
				},
				{signal: controller.signal},
			);
		});
	};
}

const STOP = Symbol("STOP");

/**
 * This decorator is used to decorate methods of the Entity class,
 * which should be used directly by the user.
 * @param method The method to decorate.
 * @param _context The context of the method.
 * @returns Decorated method.
 */
export function method<A extends SpreadParameters, T, E extends Entity>(
	fn: (this: E, ...args: A) => Promise<T>,
	_context: ClassMethodDecoratorContext<E, typeof fn>,
) {
	return async function (this: E, ...args: A) {
		const controller = new AbortController();

		const result = await Promise.race([
			fn.apply(this, args),
			new Promise<typeof STOP>(resolve =>
				window.addEventListener(
					"message",
					e => {
						if (e.data === "STOP") {
							resolve(STOP);
						}
					},
					{signal: controller.signal},
				),
			),
		]);

		controller.abort();

		if (result === STOP) {
			throw new StopError();
		}

		return result;
	};
}

/**
 * This decorator is used to decorate events of the Entity class,
 * which should be used directly by the user.
 *
 * @param method The method to decorate.
 * @param _context The context of the method.
 * @returns Decorated method.
 */
export function event<A extends [...SpreadParameters, Entity.Callback], E extends Entity>(
	fn: (this: E, ...args: A) => Promise<void>,
	_context: ClassMethodDecoratorContext<E, typeof fn>,
) {
	return async function (this: E, ...args: A) {
		const originalCallback = args.pop() as Entity.Callback;
		const newCallback: Entity.Callback = async () => {
			const self = this.createSelf();
			const controller = new AbortController();

			await Promise.race([
				originalCallback(self),
				new Promise<void>(resolve => {
					this.stopController.addEventListener(
						"stop",
						e => {
							if ((e as CustomEvent<Entity>).detail !== self) {
								resolve();
							}
						},
						{signal: controller.signal},
					);
				}),
			]);

			controller.abort();
		};

		args.push(newCallback);

		return fn.apply(this, args);
	};
}
