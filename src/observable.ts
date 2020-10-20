import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { OBSERVABLE_INSTANCE_PROP_KEYS, stubFn } from './shared';
import { ObservableProxy } from './types';

export { ObservableProxy };
export function proxify<O>(o: Observable<O>): ObservableProxy<O> {
  // we need to preserve property proxies, so that
  // ```ts
  // let o = of({ a: 42 });
  // let p = proxify(o);
  // assert(p.a === p.a);
  // ```
  const proxyForPropertyCache = new Map<keyof O, ObservableProxy<O[keyof O]>>();

  return (new Proxy(stubFn, {
    // call result = O.fn in Observable<O>
    // and make it Observable<result>
    apply(_, __, argumentsList) {
      return proxify(
        o.pipe(
          map(f => {
            // TODO: properly type it
            if (typeof f == 'function') {
              const result = Reflect.apply(f, void 0, argumentsList);
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
          map(v => {
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
  }) as unknown) as ObservableProxy<O>;
}
