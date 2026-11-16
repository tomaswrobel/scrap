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
 */
export function paced<A extends SpreadParameters, T, E extends Entity>(
	_target: object,
	_key: string | symbol,
	descriptor: TypedPropertyDescriptor<(this: E, ...args: A) => Promise<T>>,
): TypedPropertyDescriptor<(this: E, ...args: A) => Promise<T>> {
	const fn = descriptor.value;
	if (!fn) {
		return descriptor;
	}
	descriptor.value = async function (this: E, ...args: A) {
		return new Promise<T>((resolve, reject) => {
			if (this.isStopped()) {
				return reject(new StopError());
			}

			const controller = new AbortController();

			const timeout = window.setTimeout(() => {
				controller.abort();
				resolve(fn.apply(this, args));
			}, this.pace);

			this.onStop(controller.signal, () => {
				controller.abort();
				window.clearTimeout(timeout);
				reject(new StopError());
			});
		});
	};
	return descriptor;
}

const STOP = Symbol("STOP");

/**
 * This decorator is used to decorate methods of the Entity class,
 * which should be used directly by the user.
 */
export function method<A extends SpreadParameters, T, E extends Entity>(
	_target: object,
	_key: string | symbol,
	descriptor: TypedPropertyDescriptor<(this: E, ...args: A) => Promise<T>>,
): TypedPropertyDescriptor<(this: E, ...args: A) => Promise<T>> {
	const fn = descriptor.value;
	if (!fn) {
		return descriptor;
	}
	descriptor.value = async function (this: E, ...args: A) {
		if (this.isStopped()) {
			throw new StopError();
		}

		const controller = new AbortController();

		const result = await Promise.race([
			fn.apply(this, args),
			new Promise<typeof STOP>(resolve =>
				this.onStop(controller.signal, () => resolve(STOP)),
			),
		]);

		controller.abort();

		if (result === STOP) {
			throw new StopError();
		}

		return result;
	};
	return descriptor;
}

/**
 * This decorator is used to decorate events of the Entity class,
 * which should be used directly by the user.
 */
export function event<A extends [...SpreadParameters, Entity.Callback], E extends Entity>(
	_target: object,
	_key: string | symbol,
	descriptor: TypedPropertyDescriptor<(this: E, ...args: A) => Promise<void>>,
): TypedPropertyDescriptor<(this: E, ...args: A) => Promise<void>> {
	const fn = descriptor.value;
	if (!fn) {
		return descriptor;
	}
	descriptor.value = async function (this: E, ...args: A) {
		const originalCallback = args.pop() as Entity.Callback;
		const newCallback: Entity.Callback = async () => {
			const self = this.createSelf();
			const controller = new AbortController();

			await Promise.race([
				originalCallback(self),
				self.untilStoppedByOther(controller.signal),
			]);

			controller.abort();
		};

		args.push(newCallback);

		return fn.apply(this, args);
	};
	return descriptor;
}
