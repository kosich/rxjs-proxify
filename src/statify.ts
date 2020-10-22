import { BehaviorSubject } from "rxjs";
import { behaviorSubject } from "./behavior";
import { BehaviorSubjectProxy } from "./core/types";

export function statify<T,X>(o: T, x?: X): BehaviorSubjectProxy<T, X> {
  return behaviorSubject(new BehaviorSubject(o), x, true);
}

/**
 * TODO: implement and type direct access to values on state
 *
 * ```ts
 * const state = statify({ a: 2, b: 2 });
 * state.a + state.b == 4;
 * ```
 *
 * via Symbol.toPrimitive
 */


/**
 * TODO: consider implementing directly settings values
 *
 * ```ts
 * const state = statify({ a: 2 });
 * state.a = 4;
 * ```
 * via Proxy { set:… }
 */
