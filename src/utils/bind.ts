import type {Method} from "@scrap/types/Method";
import type {SpreadParameters} from "@juvofy/lib/utils/SpreadParameters";

export function bind<A extends SpreadParameters, R, T>(
	value: Method<T, A, R>,
	context: ClassMethodDecoratorContext<T, Method<T, A, R>>,
) {
	context.addInitializer(function () {
		Object.defineProperty(this, context.name, {
			value: value.bind(this),
			configurable: true,
			writable: true,
		});
	});
}
