export function bind<A extends any[], R, T>(
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

export type Method<This, Args extends unknown[], Return> = (
	this: This,
	...args: Args
) => Return;
