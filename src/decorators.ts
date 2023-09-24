export interface Method<This, Args extends any[], Return> {
    (this: This, ...args: Args): Return;
}

export function bind<K extends string, A extends any[], R, T extends Record<K, Method<T, A, R>>>(target: T, key: K, descriptor: TypedPropertyDescriptor<Method<T, A, R>>) {
    const originalMethod = target[key];

    descriptor.value = function (this: T, ...args: A) {
        return originalMethod.apply(this, args);
    };
}