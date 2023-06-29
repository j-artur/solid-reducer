import type { SetStoreFunction, Store } from "solid-js/store"

export type BaseRecord = Record<string, any>

export type ActionMap<TActionRecord extends BaseRecord> = {
  [Key in keyof TActionRecord]: void extends TActionRecord[Key]
    ? () => void
    : (payload: TActionRecord[Key]) => void
}

export type Reducer<TStore, TActionRecord extends BaseRecord> = (
  store: Store<TStore>,
  setStore: SetStoreFunction<TStore>,
  dispatch: DispatchFn<TActionRecord>
) => ActionMap<TActionRecord>

export type DispatchFn<TActionRecord extends BaseRecord> = <
  TActionType extends keyof TActionRecord & string
>(
  type: TActionType,
  ...[payload]: void extends TActionRecord[TActionType]
    ? []
    : [payload: TActionRecord[TActionType]]
) => void

export type Dispatcher<TActionRecord extends BaseRecord> =
  DispatchFn<TActionRecord> & {
    subset: <TAction extends keyof TActionRecord & string>(
      this: DispatchFn<TActionRecord>,
      actions: TAction[]
    ) => SubDispatcher<TActionRecord, TAction>
  }

export type SubDispatcher<
  TActionRecord extends BaseRecord,
  TAction extends keyof TActionRecord & string
> = DispatchFn<Pick<TActionRecord, TAction>> & {
  subset: <TSubAction extends TAction>(
    this: DispatchFn<Pick<TActionRecord, TAction>>,
    actions: TSubAction[]
  ) => SubDispatcher<TActionRecord, TSubAction>
}
