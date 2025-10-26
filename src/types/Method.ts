export type Method<This, Args extends unknown[], Return> = (
	this: This,
	...args: Args
) => Return;
