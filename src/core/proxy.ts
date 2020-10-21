import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { noop, OBSERVABLE_INSTANCE_PROP_KEYS } from "./shared";
import { ObservableProxy, Path } from "./types";

// core api proxy
export function coreProxy<O>(o: Observable<O>, ps: Path, getOverrides?: any): ObservableProxy<O> {
  // we need to preserve property proxies, so that
  // ```ts
  // let o = of({ a: 42 });
  // let p = proxify(o);
  // assert(p.a === p.a);
  // ```
  const proxyForPropertyCache = new Map<keyof O, ObservableProxy<O[keyof O]>>();

  return (new Proxy(noop, {
    // call result = O.fn in Observable<O>
    // and make it Observable<result>
    apply(_, __, argumentsList) {
      return coreProxy(
        o.pipe(
          map(f => {
            // TODO: properly type it
            if (typeof f == 'function') {
              const result = Reflect.apply(f, void 0, argumentsList);
              return result;
            }

            // non-function or null values are skipped
            return null;
          })
        ),
        []
      );
    },

    // get Observable<O.prop> from Observable<O>
    get(_, p: keyof O & keyof Observable<O>, receiver) {
      if (getOverrides && p in getOverrides) {
        return getOverrides[p](ps);
      }

      // shortcut for pipe
      if (p == 'pipe') {
        return function () {
          const pipe = Reflect.get(o, p, receiver);
          const r = Reflect.apply(pipe, o, arguments);
          return coreProxy(r, ps.concat(p));
        };
      }

      // pass through Observable methods/props
      if (OBSERVABLE_INSTANCE_PROP_KEYS.includes(p as any)) {
        const builtIn = Reflect.get(o, p, receiver);
        // NOTE: we're binding .pipe, .subscribe, .lift, etc to current Source,
        // so that inner calls to `this` wont go through proxy again. This is
        // not equal to raw Rx where these fns are not bound
        if (typeof builtIn == 'function') {
          return builtIn.bind(o);
        } else {
          return builtIn;
        }
      }

      if (proxyForPropertyCache.has(p)) {
        return proxyForPropertyCache.get(p);
      }

      // return proxified sub-property
      const subproxy = coreProxy(
        o.pipe(
          map(v => {
            if (v == null) {
              // similar to pluck, we skip nullish values
              return v;
            } else if (typeof v[p] == 'function') {
              // we should keep the context for methods
              return (v[p] as any).bind(v);
            } else {
              // pluck
              return v[p];
            }
          })
        ) as Observable<O[typeof p]>,
        ps.concat(p),
        getOverrides
      );

      // cache o.prop.subprop
      proxyForPropertyCache.set(p, subproxy);
      return subproxy;
    },
  }) as unknown) as ObservableProxy<O>;
}
