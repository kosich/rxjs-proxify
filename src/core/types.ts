import { Observable, Observer, OperatorFunction } from 'rxjs';

// Proxy kinds {{{
export type ObservableProxy<O> =
  ValueProxy<O, ProxyKind.Observable> & (
    O extends (...args: infer P) => infer R
    ? ICallableProxiedObservable<O, P, R>
    : IProxiedObservable<O>
  );

export type SubjectProxy<O> =
  ValueProxy<O, ProxyKind.Observable> & (
    O extends (...args: infer P) => infer R
    ? ICallableProxiedObservable<O, P, R>
    : IProxiedSubject<O>
  );

export type BehaviorSubjectProxy<O> =
  ValueProxy<O, ProxyKind.State> & (
    O extends (...args: infer P) => infer R
    ? ICallableProxiedObservable<O, P, R>
    : IProxiedState<O>
  ) & O;

// helper to distinguish root types
type TProxy<O, K extends ProxyKind> =
  K extends ProxyKind.State
  ? BehaviorSubjectProxy<O>
  : K extends ProxyKind.Subject
  ? SubjectProxy<O>
  // T == ProxyType.Observable
  : ObservableProxy<O>

enum ProxyKind {
  Observable,
  Subject,
  State
};
// }}}

// Basic proxy with props as proxify
type ValueProxy<O, K extends ProxyKind> =
  O extends null
  ? {}
  : O extends boolean
  ? { [P in keyof Boolean]: ObservableProxy<Boolean[P]> }
  : O extends string
  ? { [P in keyof String]: ObservableProxy<String[P]> }
  : O extends number
  ? { [P in keyof Number]: ObservableProxy<Number[P]> }
  : O extends bigint
  ? { [P in keyof BigInt]: ObservableProxy<BigInt[P]> }
  : O extends symbol
  ? { [P in keyof Symbol]: ObservableProxy<Symbol[P]> }
  // special hack for array type
  : O extends (infer R)[]
  ? { [P in keyof R[]]: TProxy<R[][P], K> }
  // any object
  : { [P in keyof O]: TProxy<O[P], K> };

// Callable Proxied Observable
type BasicFn = (...args: any[]) => any;

interface ICallableProxiedObservable<F extends BasicFn, P1 extends any[], R1> extends IProxiedObservable<F> {
  (...args: P1): ObservableProxy<R1>;
}

// State API
interface IProxiedState<O> extends IProxiedSubject<O> {
  readonly value: O;
  getValue(): O;
}

// Subject API
interface IProxiedSubject<O> extends IProxiedObservable<O>, Observer<O> {
  next(value: O): void;
  error(err: any): void;
  complete(): void;
}

// Observable with pipe method, returning Proxify
interface IProxiedObservable<O> extends Observable<O> {
  pipe(): ObservableProxy<O>;
  pipe<A>(op1: OperatorFunction<O, A>): ObservableProxy<A>;
  pipe<A, B>(
    op1: OperatorFunction<O, A>,
    op2: OperatorFunction<A, B>,
  ): ObservableProxy<B>;
  pipe<A, B, C>(
    op1: OperatorFunction<O, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
  ): ObservableProxy<C>;
  pipe<A, B, C, D>(
    op1: OperatorFunction<O, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
    op4: OperatorFunction<C, D>,
  ): ObservableProxy<D>;
  pipe<A, B, C, D, E>(
    op1: OperatorFunction<O, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
    op4: OperatorFunction<C, D>,
    op5: OperatorFunction<D, E>,
  ): ObservableProxy<E>;
  pipe<A, B, C, D, E, F>(
    op1: OperatorFunction<O, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
    op4: OperatorFunction<C, D>,
    op5: OperatorFunction<D, E>,
    op6: OperatorFunction<E, F>,
  ): ObservableProxy<F>;
  pipe<A, B, C, D, E, F, G>(
    op1: OperatorFunction<O, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
    op4: OperatorFunction<C, D>,
    op5: OperatorFunction<D, E>,
    op6: OperatorFunction<E, F>,
    op7: OperatorFunction<F, G>,
  ): ObservableProxy<G>;
  pipe<A, B, C, D, E, F, G, H>(
    op1: OperatorFunction<O, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
    op4: OperatorFunction<C, D>,
    op5: OperatorFunction<D, E>,
    op6: OperatorFunction<E, F>,
    op7: OperatorFunction<F, G>,
    op8: OperatorFunction<G, H>,
  ): ObservableProxy<H>;
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
  ): ObservableProxy<I>;
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
  ): ObservableProxy<{}>;
};

export type Key = string | number | symbol;
export type Path = Key[];
