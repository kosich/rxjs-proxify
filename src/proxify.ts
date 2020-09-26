import { Observable, OperatorFunction } from 'rxjs';
import { map } from 'rxjs/operators';

// keys to preserve for Observable to work
// these were manually picked from Observable type
// TODO: consider doing prototype chain check instead
const OBSERVABLE_INSTANCE_PROP_KEYS = [
    '_isScalar',
    'source',
    'operator',
    'lift',
    'subscribe',
    '_trySubscribe',
    'forEach',
    '_subscribe',
    'pipe',
    'toPromise',
];

// a fn that will be used as Proxy basis
// so that we could use Proxy.apply override
// for a.b.c().subscribe(…) scenarios
const stubFn = () => void 0;

export function proxify<O>(o: Observable<O>): Proxify<O> {
    // we need to preserve property proxies, so that
    // ```ts
    // let o = of({ a: 42 });
    // let p = proxify(o);
    // assert(p.a === p.a);
    // ```
    const proxyForPropertyCache = new Map<keyof O, Proxify<O[keyof O]>>();

    return (new Proxy(stubFn, {
        // call result = O.fn in Observable<O>
        // and make it Observable<result>
        apply(_, __, argumentsList) {
            return proxify(
                o.pipe(
                    map((f) => {
                        // TODO: properly type it
                        if (typeof f == 'function') {
                            const result = Reflect.apply(
                                f,
                                void 0,
                                argumentsList,
                            );
                            return result;
                        }

                        // non-function or null values are skipped
                        return null;
                    }),
                ),
            );
        },

        // get Observable<O.prop> from Observable<O>
        get(_, prop: keyof O & keyof Observable<O>, receiver) {
            // shortcut for pipe
            if (prop == 'pipe') {
                return function () {
                    const pipe = Reflect.get(o, prop, receiver);
                    const r = Reflect.apply(pipe, o, arguments);
                    return proxify(r);
                };
            }

            // pass through Observable methods/props
            if (OBSERVABLE_INSTANCE_PROP_KEYS.includes(prop as any)) {
                return Reflect.get(o, prop, receiver);
            }

            if (proxyForPropertyCache.has(prop)) {
                return proxyForPropertyCache.get(prop);
            }

            // return proxified sub-property
            const subproxy = proxify(
                o.pipe(
                    map((v) => {
                        if (v == null) {
                            // similar to pluck, we skip nullish values
                            return v;
                        } else if (typeof v[prop] == 'function') {
                            // we should keep the context for methods
                            return (v[prop] as any).bind(v);
                        } else {
                            // pluck
                            return v[prop];
                        }
                    }),
                ) as Observable<O[typeof prop]>,
            );

            proxyForPropertyCache.set(prop, subproxy);
            return subproxy;
        },
    }) as unknown) as Proxify<O>;
}

export type Proxify<O> =
    // O is function ?
    O extends (...args: any[]) => infer R
        ? // make it callable
          (
              ...args: Parameters<O>
          ) => Proxify<R> & ProxiedPipeObservable<O> & Proxy<O>
        : // simple proxy otherwise
          ProxiedPipeObservable<O> & Proxy<O>;

// RxJS Observable with pipe method, returning Proxify
export type ProxiedPipeObservable<O> = Omit<Observable<O>, 'pipe'> & {
    pipe(): Proxify<O>;
    pipe<A>(op1: OperatorFunction<O, A>): Proxify<A>;
    pipe<A, B>(
        op1: OperatorFunction<O, A>,
        op2: OperatorFunction<A, B>,
    ): Proxify<B>;
    pipe<A, B, C>(
        op1: OperatorFunction<O, A>,
        op2: OperatorFunction<A, B>,
        op3: OperatorFunction<B, C>,
    ): Proxify<C>;
    pipe<A, B, C, D>(
        op1: OperatorFunction<O, A>,
        op2: OperatorFunction<A, B>,
        op3: OperatorFunction<B, C>,
        op4: OperatorFunction<C, D>,
    ): Proxify<D>;
    pipe<A, B, C, D, E>(
        op1: OperatorFunction<O, A>,
        op2: OperatorFunction<A, B>,
        op3: OperatorFunction<B, C>,
        op4: OperatorFunction<C, D>,
        op5: OperatorFunction<D, E>,
    ): Proxify<E>;
    pipe<A, B, C, D, E, F>(
        op1: OperatorFunction<O, A>,
        op2: OperatorFunction<A, B>,
        op3: OperatorFunction<B, C>,
        op4: OperatorFunction<C, D>,
        op5: OperatorFunction<D, E>,
        op6: OperatorFunction<E, F>,
    ): Proxify<F>;
    pipe<A, B, C, D, E, F, G>(
        op1: OperatorFunction<O, A>,
        op2: OperatorFunction<A, B>,
        op3: OperatorFunction<B, C>,
        op4: OperatorFunction<C, D>,
        op5: OperatorFunction<D, E>,
        op6: OperatorFunction<E, F>,
        op7: OperatorFunction<F, G>,
    ): Proxify<G>;
    pipe<A, B, C, D, E, F, G, H>(
        op1: OperatorFunction<O, A>,
        op2: OperatorFunction<A, B>,
        op3: OperatorFunction<B, C>,
        op4: OperatorFunction<C, D>,
        op5: OperatorFunction<D, E>,
        op6: OperatorFunction<E, F>,
        op7: OperatorFunction<F, G>,
        op8: OperatorFunction<G, H>,
    ): Proxify<H>;
    pipe<A, B, C, D, E, F, G, H, I>(
        op1: OperatorFunction<O, A>,
        op2: OperatorFunction<A, B>,
        op3: OperatorFunction<B, C>,
        op4: OperatorFunction<C, D>,
        op5: OperatorFunction<D, E>,
        op6: OperatorFunction<E, F>,
        op7: OperatorFunction<F, G>,
        op8: OperatorFunction<G, H>,
        op9: OperatorFunction<H, I>,
    ): Proxify<I>;
    pipe<A, B, C, D, E, F, G, H, I>(
        op1: OperatorFunction<O, A>,
        op2: OperatorFunction<A, B>,
        op3: OperatorFunction<B, C>,
        op4: OperatorFunction<C, D>,
        op5: OperatorFunction<D, E>,
        op6: OperatorFunction<E, F>,
        op7: OperatorFunction<F, G>,
        op8: OperatorFunction<G, H>,
        op9: OperatorFunction<H, I>,
        ...operations: OperatorFunction<any, any>[]
    ): Proxify<{}>;
};

export type Proxy<O> = { [P in keyof O]: Proxify<O[P]> };
