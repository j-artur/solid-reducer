import { Store, createStore } from "solid-js/store"
import { ReducerError } from "./error"
import {
  Action,
  ActionMap,
  BaseRecord,
  DispatchFn,
  Dispatcher,
  PathInto,
  PathIntoAction,
  PrefixInto,
  PrefixedDispatcher,
  Reducer,
  RestrictRecord,
  SubDispatcher,
  SubRecord,
} from "./types"

function get<T extends BaseRecord>(
  record: T,
  path: string[],
  index = 0
): ((payload: unknown) => void) | null {
  const key = path[index]
  if (key === undefined) return null

  const value = record[key]
  if (value === undefined) return null

  if (typeof value === "function") {
    return value
  }

  if (typeof value === "object") {
    return get(value, path, index + 1)
  }

  return null
}

function handle<TRecord extends BaseRecord, P extends PathIntoAction<TRecord>>(
  record: ActionMap<TRecord>,
  path: P
): Action<TRecord, P> {
  const action = get(record, path.split("."))

  if (action === null) {
    throw new ReducerError(`Action "${path}" not found`)
  }

  return action as Action<TRecord, P>
}

export function createReducer<
  TStore extends object,
  TRecord extends BaseRecord
>(
  reducer: Reducer<TStore, TRecord>,
  initialValue: TStore,
  options?: { name?: string }
): [Store<TStore>, Dispatcher<TRecord>] {
  const [store, setStore] = createStore(initialValue, options)

  const dispatch: DispatchFn<TRecord> = (action, ...[payload]) => {
    handle(handlers, action)(payload!)
  }
  const handlers = reducer(store, setStore, dispatch)

  const dispatcher: Dispatcher<TRecord> = Object.assign(dispatch, {
    subset,
    prefix,
  })

  return [store, dispatcher]
}

function subset<TRecord extends BaseRecord, TAction extends PathInto<TRecord>>(
  this: DispatchFn<TRecord>,
  actions: TAction[]
): SubDispatcher<TRecord, TAction> {
  const dispatch: DispatchFn<RestrictRecord<TRecord, TAction>> = (
    action,
    ...[payload]
  ) => {
    const prefixes = actions.map(action => action.split("."))

    const path = action.split(".")

    const index = prefixes.findIndex(prefix => {
      if (prefix.length > path.length) return false
      for (let i = 0; i < prefix.length; i++) {
        if (prefix[i] !== path[i]) return false
      }
      return true
    })

    if (index === -1) {
      throw new ReducerError(`Action "${action}" not found`)
    }

    this(action as PathIntoAction<TRecord>, ...([payload] as any))
  }

  return Object.assign(dispatch, { subset })
}

function prefix<
  TRecord extends BaseRecord,
  TPrefix extends PrefixInto<TRecord>
>(
  this: DispatchFn<TRecord>,
  pathPrefix: TPrefix
): PrefixedDispatcher<TRecord, TPrefix> {
  const dispatch: DispatchFn<SubRecord<TRecord, TPrefix>> = (
    action,
    ...[payload]
  ) => {
    try {
      this(
        `${pathPrefix}.${action}` as PathIntoAction<TRecord>,
        ...([payload] as any)
      )
    } catch (error) {
      if (error instanceof ReducerError) {
        throw new ReducerError(`Action "${action}" not found`, { cause: error })
      }
      throw error
    }
  }

  return Object.assign(dispatch, { subset, prefix })
}
