export interface Method<This, Args extends any[], Return> {
    (this: This, ...args: Args): Return;
}

export function bind<K extends string, A extends any[], R, T extends Record<K, Method<T, A, R>>>(
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
    }
}