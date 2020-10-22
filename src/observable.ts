import { Observable } from "rxjs";
import { coreProxy } from "./core/proxy";
import { ObservableProxy } from "./core/types";

export function observable<O, X>(source$: Observable<O>, x?: X): ObservableProxy<O, X> {
  return coreProxy(source$, [], void 0, x) as ObservableProxy<O, X>;
}
