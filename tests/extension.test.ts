import { of } from "rxjs";
import { ObservableProxy, proxify } from "../src";

interface Extension {
  _<S>(this:S): S extends ObservableProxy<infer A, unknown> ? A : never;
  $<S>(this:S): S extends ObservableProxy<infer A, unknown> ? A : never;
}

const x: Extension = {
  _() { return 1 as any; },
  $() { return 1 as any; }
}

let source = proxify(of({ a: 1 }, { a: 2 }), x);
const d = source.a._()
