import type {Method} from "@scrap/types/Method";
import type {SpreadParameters} from "@juvofy/lib/utils/SpreadParameters";

export function bind<T, A extends SpreadParameters, R>(
	_target: object,
	propertyKey: string | symbol,
	descriptor: TypedPropertyDescriptor<Method<T, A, R>>,
): TypedPropertyDescriptor<Method<T, A, R>> | void {
	const original = descriptor.value;
	if (!original) {
		return descriptor;
	}

	return {
		configurable: true,
		get(this: T) {
			// If the method is accessed on the prototype, return the original function
			// so we don't bind unnecessarily.
			if (this === _target) {
				return original;
			}

			// Create a bound function and define it directly on the instance so the
			// getter won't run again for this instance.
			const bound = (original as unknown as Function).bind(this);
			Object.defineProperty(this, propertyKey, {
				value: bound,
				configurable: true,
				writable: true,
			});

			return bound as Method<T, A, R>;
		},
	};
}
