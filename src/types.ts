import type { SetStoreFunction, Store } from "solid-js/store"

export type BaseRecord = Record<string, any>

export type NestedRecord<T extends BaseRecord = BaseRecord> = () => T

export type UnwrapRecord<T extends NestedRecord> = ReturnType<T>

export type PathInto<T extends BaseRecord> = keyof {
  [K in keyof T as T[K] extends NestedRecord
    ? K | `${K & string}.${PathInto<UnwrapRecord<T[K]>> & string}`
    : K]: any
} &
  string

export type PathIntoAction<T extends BaseRecord> = keyof {
  [K in keyof T as T[K] extends NestedRecord
    ? `${K & string}.${PathIntoAction<UnwrapRecord<T[K]>> & string}`
    : K]: any
} &
  string

type Payload<
  T extends BaseRecord,
  P extends PathIntoAction<T>
> = P extends keyof T
  ? T[P]
  : P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? T[K] extends NestedRecord
      ? Rest extends PathIntoAction<UnwrapRecord<T[K]>>
        ? Payload<UnwrapRecord<T[K]>, Rest>
        : never
      : never
    : never
  : never

export type Action<T extends BaseRecord, P extends PathIntoAction<T>> = (
  payload: Payload<T, P>
) => void

type Simplify<T> = T extends object ? { [K in keyof T]: T[K] } : T

type Merge<T extends object> = Simplify<
  (T extends any ? (t: T) => void : never) extends (
    t: infer U extends object
  ) => void
    ? U
    : never
>

export type ActionMap<TPayloadRecord extends BaseRecord> = {
  [Key in keyof TPayloadRecord]: TPayloadRecord[Key] extends Function
    ? TPayloadRecord[Key] extends NestedRecord<infer InnerRecord>
      ? Simplify<ActionMap<InnerRecord>>
      : never
    : void extends TPayloadRecord[Key]
    ? () => void
    : (payload: TPayloadRecord[Key]) => void
}

export type PayloadMap<TActionRecord extends BaseRecord> = {
  [Key in keyof TActionRecord]: TActionRecord[Key] extends Function
    ? Parameters<TActionRecord[Key]>[0] extends void
      ? void
      : Parameters<TActionRecord[Key]>[0]
    : TActionRecord[Key] extends BaseRecord
    ? NestedRecord<Simplify<PayloadMap<TActionRecord[Key]>>>
    : never
}

type RestrictObject<T extends BaseRecord, P extends PathInto<T>> = Merge<
  P extends keyof T
    ? { [K in P]: T[K] }
    : P extends `${infer K}.${infer Rest}`
    ? K extends keyof T
      ? { [Key in K]: RestrictObject<T[K], Rest> }
      : never
    : never
>

export type RestrictRecord<
  T extends BaseRecord,
  P extends PathInto<T>
> = Simplify<PayloadMap<RestrictObject<ActionMap<T>, P>>>

export type Reducer<TStore, TActionRecord extends BaseRecord> = (
  store: Store<TStore>,
  setStore: SetStoreFunction<TStore>,
  dispatch: DispatchFn<TActionRecord>
) => ActionMap<TActionRecord>

export type DispatchFn<TRecord extends BaseRecord> = <
  TAction extends PathIntoAction<TRecord>
>(
  action: TAction,
  ...[payload]: void extends Payload<TRecord, TAction>
    ? []
    : [payload: Payload<TRecord, TAction>]
) => void

export type Dispatcher<TRecord extends BaseRecord> = DispatchFn<TRecord> & {
  subset: <TAction extends PathInto<TRecord>>(
    this: DispatchFn<TRecord>,
    actions: TAction[]
  ) => SubDispatcher<TRecord, TAction>
}

export type SubDispatcher<
  TRecord extends BaseRecord,
  TAllowedActions extends PathInto<TRecord>
> = DispatchFn<RestrictRecord<TRecord, TAllowedActions>> & {
  subset: <TAction extends PathInto<RestrictRecord<TRecord, TAction>>>(
    this: DispatchFn<RestrictRecord<TRecord, TAction>>,
    actions: TAction[]
  ) => SubDispatcher<RestrictRecord<TRecord, TAction>, TAction>
}
