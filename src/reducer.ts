import { Store, createStore } from "solid-js/store"
import { BaseRecord, DispatchFn, Dispatcher, Reducer } from "./types"

export function createReducer<
  TStore extends object,
  TActionRecord extends BaseRecord
>(
  reducer: Reducer<TStore, TActionRecord>,
  initialValue: TStore,
  options?: { name?: string }
): [Store<TStore>, Dispatcher<TActionRecord>] {
  const [store, setStore] = createStore(initialValue, options)

  const dispatch: DispatchFn<TActionRecord> = (t, ...[p]) => handlers[t](p!)
  const handlers = reducer(store, setStore, dispatch)

  const dispatcher: Dispatcher<TActionRecord> = Object.assign(dispatch, {
    subset,
  })

  return [store, dispatcher]
}

function subset<
  TActionRecord extends BaseRecord,
  TAction extends keyof TActionRecord & string
>(
  this: DispatchFn<TActionRecord>,
  actions: TAction[]
): Dispatcher<Pick<TActionRecord, TAction>> {
  const subdispatch: DispatchFn<Pick<TActionRecord, TAction>> = (
    type,
    ...[payload]
  ) => {
    if (!actions.includes(type)) {
      throw new Error(`Action "${type}" not allowed from this dispatcher`)
    }
    this(type, ...([payload] as any))
  }

  return Object.assign(subdispatch, { subset })
}
