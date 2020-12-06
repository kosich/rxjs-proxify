import { Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { noop, OBSERVABLE_INSTANCE_PROP_KEYS } from './shared';
import { Key, ObservableProxy, Path } from './types';

// core api proxy
export function coreProxy<O>(
  o: Observable<O>,
  ps: Path = [],
  getOverride?: (ps: Path, p: Key) => (() => any) | null,
  distinct?: boolean,
): ObservableProxy<O> {
  // we need to preserve property proxies, so that
  // ```ts
  // let o = of({ a: 42 });
  // let p = proxify(o);
  // assert(p.a === p.a);
  // ```
  const proxyForPropertyCache = new Map<keyof O, ObservableProxy<O[keyof O]>>();

  return (new Proxy(noop, {
    getPrototypeOf: function () {
      return Observable.prototype;
    },
    // call result = O.fn in Observable<O>
    // and make it Observable<result>
    apply(_, __, argumentsList) {
      return coreProxy(
        o.pipe(
          deepPluck(ps),
          map(f => {
            // apply function
            if (typeof f == 'function') {
              return Reflect.apply(f, void 0, argumentsList);
            }

            // non-function or null values are skipped
            return f;
          }),
        ),
      );
    },

    // get Observable<O.prop> from Observable<O>
    get(_, p: keyof O & keyof Observable<O>, receiver) {
      const override = getOverride && getOverride(ps, p);
      if (override) {
        return override();
      }

      // pass through Observable methods/props
      const isPipe = p == 'pipe';
      if (isPipe || OBSERVABLE_INSTANCE_PROP_KEYS.includes(p)) {
        const deepO = o.pipe(deepPluck(ps), maybeDistinct(distinct));
        const builtIn = Reflect.get(deepO, p, receiver);

        if (!isPipe) {
          // NOTE: we're binding .pipe, .subscribe, .lift, etc to current Source,
          // so that inner calls to `this` wont go through proxy again. This is
          // not equal to raw Rx where these fns are not bound
          return typeof builtIn == 'function' ? builtIn.bind(deepO) : builtIn;
        }

        // we should wrap piped observable into another proxy
        return function () {
          const applied = Reflect.apply(builtIn, deepO, arguments);
          return coreProxy(applied);
        };
      }

      if (proxyForPropertyCache.has(p)) {
        return proxyForPropertyCache.get(p);
      }

      // return proxified sub-property
      const subproxy = coreProxy<O[typeof p]>(o as any, ps.concat(p), getOverride, distinct);

      // cache, so that o.a.b == o.a.b
      proxyForPropertyCache.set(p, subproxy);
      return subproxy;
    },
  }) as unknown) as ObservableProxy<O>;
}

// Helper Operators
// distinct value if needed
function maybeDistinct<T>(distinct: boolean) {
  return (o: Observable<T>) => {
    return distinct ? o.pipe(distinctUntilChanged<T>()) : o;
  };
}

// read deep value by path, bind if needed
function deepPluck<T>(ps: Path) {
  return (observable: Observable<T>) => {
    if (!ps.length) {
      return observable;
    }

    return observable.pipe(
      map(v => {
        // keep ref to parent
        let k = void 0;

        // similar to pluck, we skip nullish values
        for (let p of ps) {
          if (v == null) {
            return v;
          } else {
            k = v;
            v = v[p];
          }
        }

        // we should keep the context for methods
        // so if the last prop is function -- we bind it
        if (typeof v == 'function') {
          return v.bind(k);
        }

        return v;
      }),
    );
  };
}
