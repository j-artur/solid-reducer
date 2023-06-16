import { SetStoreFunction, createStore } from "solid-js/store"

export type Reducer<
  TStore,
  TRecord extends {
    [Key: string]: ((payload: any) => void) | (() => void)
  }
> = (setStore: SetStoreFunction<TStore>) => TRecord

export function createReducer<
  TStore extends object,
  TActionMap extends {
    [Key: string]: ((payload: any) => void) | (() => void)
  }
>(
  reducer: Reducer<TStore, TActionMap>,
  initialValue: TStore,
  options?: { name?: string }
) {
  const [store, setStore] = createStore(initialValue, options)

  const handlers = reducer(setStore)

  function dispatch<TType extends keyof TActionMap>(
    type: TType,
    ...[payload]: Parameters<TActionMap[TType]>[0] extends void
      ? []
      : [payload: Parameters<TActionMap[TType]>[0]]
  ): void {
    if (type in handlers) {
      handlers[type]!(payload)
    }
  }

  return [store, dispatch] as const
}
