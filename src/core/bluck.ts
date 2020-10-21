import { Observable } from "rxjs";
import { pluck } from "rxjs/operators";
import { Path } from "./types";

// bluck is similar to pluck
export function bluck<T>(ps: Path) {
  return (observable: Observable<T>) => {
    if (!ps.length) {
      return observable;
    }

    return observable.pipe(pluck(...(ps as any[])));
  };
}
