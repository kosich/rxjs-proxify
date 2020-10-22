import { Observable, Observer, OperatorFunction } from 'rxjs';

// Proxy kinds {{{
export type ObservableProxy<O, X> =
  ValueProxy<O, X, ProxyKind.Observable> & (
    O extends (...args: infer P) => infer R
    ? ICallableProxiedObservable<O, P, R, X>
    : IProxiedObservable<O, X>
  ) & X;

export type SubjectProxy<O, X> =
  ValueProxy<O, X, ProxyKind.Observable> & (
    O extends (...args: infer P) => infer R
    ? ICallableProxiedObservable<O, P, R, X>
    : IProxiedSubject<O, X>
  );

export type BehaviorSubjectProxy<O, X> =
  ValueProxy<O, X, ProxyKind.State> & (
    O extends (...args: infer P) => infer R
    ? ICallableProxiedObservable<O, P, R, X>
    : IProxiedBehaviorSubject<O, X>
  );

// helper to distinguish root types
type TProxy<O, X, K extends ProxyKind> =
  K extends ProxyKind.State
  ? BehaviorSubjectProxy<O, X>
  : K extends ProxyKind.Subject
  ? SubjectProxy<O, X>
  // T == ProxyType.Observable
  : ObservableProxy<O, X>

enum ProxyKind {
  Observable,
  Subject,
  State
};
// }}}

// Basic proxy with props as proxify
type ValueProxy<O, X, K extends ProxyKind> =
  O extends null
  ? {}
  : O extends boolean
  ? { [P in keyof Boolean]: ObservableProxy<Boolean[P], X> }
  : O extends string
  ? { [P in keyof String]: ObservableProxy<String[P], X> }
  : O extends number
  ? { [P in keyof Number]: ObservableProxy<Number[P], X> }
  : O extends bigint
  ? { [P in keyof BigInt]: ObservableProxy<BigInt[P], X> }
  : O extends symbol
  ? { [P in keyof Symbol]: ObservableProxy<Symbol[P], X> }
  // special hack for array type
  : O extends (infer R)[]
  ? { [P in keyof R[]]: TProxy<R[][P], X, K> }
  // any object
  : { [P in keyof O]: TProxy<O[P], X, K> };

// Callable Proxied Observable
type BasicFn = (...args: any[]) => any;

interface ICallableProxiedObservable<F extends BasicFn, P1 extends any[], R1, X> extends IProxiedObservable<F, X> {
  (...args: P1): ObservableProxy<R1, X>;
}

// State API
interface IProxiedBehaviorSubject<O, X> extends IProxiedSubject<O, X> {
  readonly value: O;
  getValue(): O;
}

// Subject API
interface IProxiedSubject<O, X> extends IProxiedObservable<O, X>, Observer<O> {
  next(value: O): void;
  error(err: any): void;
  complete(): void;
}

// Observable with pipe method, returning Proxify
interface IProxiedObservable<O, X> extends Observable<O> {
  pipe(): ObservableProxy<O, X>;
  pipe<A>(op1: OperatorFunction<O, A>): ObservableProxy<A, X>;
  pipe<A, B>(
    op1: OperatorFunction<O, A>,
    op2: OperatorFunction<A, B>,
  ): ObservableProxy<B, X>;
  pipe<A, B, C>(
    op1: OperatorFunction<O, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
  ): ObservableProxy<C, X>;
  pipe<A, B, C, D>(
    op1: OperatorFunction<O, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
    op4: OperatorFunction<C, D>,
  ): ObservableProxy<D, X>;
  pipe<A, B, C, D, E>(
    op1: OperatorFunction<O, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
    op4: OperatorFunction<C, D>,
    op5: OperatorFunction<D, E>,
  ): ObservableProxy<E, X>;
  pipe<A, B, C, D, E, F>(
    op1: OperatorFunction<O, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
    op4: OperatorFunction<C, D>,
    op5: OperatorFunction<D, E>,
    op6: OperatorFunction<E, F>,
  ): ObservableProxy<F, X>;
  pipe<A, B, C, D, E, F, G>(
    op1: OperatorFunction<O, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
    op4: OperatorFunction<C, D>,
    op5: OperatorFunction<D, E>,
    op6: OperatorFunction<E, F>,
    op7: OperatorFunction<F, G>,
  ): ObservableProxy<G, X>;
  pipe<A, B, C, D, E, F, G, H>(
    op1: OperatorFunction<O, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
    op4: OperatorFunction<C, D>,
    op5: OperatorFunction<D, E>,
    op6: OperatorFunction<E, F>,
    op7: OperatorFunction<F, G>,
    op8: OperatorFunction<G, H>,
  ): ObservableProxy<H, X>;
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
  ): ObservableProxy<I, X>;
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
  ): ObservableProxy<{}, X>;
};

export type Key = string | number | symbol;
export type Path = Key[];
