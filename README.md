# Solid Reducer

A simple reducer for SolidJS.

Inspired by [React](https://reactjs.org/)'s [useReducer](https://reactjs.org/docs/hooks-reference.html#usereducer) hook, `solid-reducer` is a simple reducer for [SolidJS](https://www.solidjs.com/).

## Installation

```bash
npm i @jartur/solid-reducer

yarn add @jartur/solid-reducer

pnpm add @jartur/solid-reducer
```

## Usage

### Without explicit types:

```ts
import { createReducer } from "@jartur/solid-reducer";

const [store, dispatch] = createReducer(
  (set) => ({
    increment: () => set("count", (c) => c + 1),
    decrement: () => set("count", (c) => c - 1),
    setText: (payload: string) => set("text", payload),
  }),
  { count: 0, text: "" }
);

console.log(store); // { count: 0, text: "" }
dispatch("increment");
console.log(store); // { count: 1, text: "" }
dispatch("decrement");
console.log(store); // { count: 0, text: "" }
dispatch("setText", "foo");
console.log(store); // { count: 0, text: "foo" }
```

### With explicit types:

```ts
import { Reducer, createReducer } from "@jartur/solid-reducer";

type State = {
  count: number;
  text: string;
};

type ActionRecord = {
  increment: void;
  decrement: void;
  setText: string;
};

const reducer: Reducer<State, ActionRecord> = (set) => ({
  increment: () => set("count", (c) => c + 1),
  decrement: () => set("count", (c) => c - 1),
  setText: (payload) => set("text", payload),
});

const [store, dispatch] = createReducer(reducer, { count: 0, text: "" });

console.log(store); // { count: 0, text: "" }
dispatch("increment");
console.log(store); // { count: 1, text: "" }
dispatch("decrement");
console.log(store); // { count: 0, text: "" }
dispatch("setText", "foo");
console.log(store); // { count: 0, text: "foo" }
```

## API

### createReducer

The `createReducer` function takes a reducer function and an initial value and returns a store and a dispatch function.

```ts
function createReducer<Store extends object, ActionRecord extends BaseRecord>(
  reducer: Reducer<Store, ActionRecord>,
  initialValue: Store
): [Store<Store>, Dispatcher<ActionRecord>];
```

### Reducer

The reducer function is a setup function that takes a `setStore` function and a `store` and returns an object with action handlers.

Action handlers are just functions that take a payload to update the store.

```ts
type Reducer<Store, ActionRecord> = (
  setStore: SetStoreFunction<Store>,
  store: Store
) => ActionMap<ActionRecord>;

type ActionMap<ActionRecord> = {
  [Action in keyof ActionRecord]: void extends ActionRecord[Action]
    ? () => void
    : (payload: ActionRecord[Action]) => void;
};
```

### setStore and store

The `setStore` function and the `store` object are from [`solid-js/store`](https://www.solidjs.com/docs/latest/api#using-stores).

### ActionRecord

The `ActionRecord` type is a record that maps action types to their payload types. Actions that do not have a payload are mapped to `void`.

### dispatch

The `dispatch` function receives an action type and a payload and calls the corresponding action handler.

If the ActionRecord defines a payload of type `void`, there is no second argument.

```ts
export type DispatchFn<TActionRecord extends BaseRecord> = <
  TActionType extends keyof TActionRecord
>(
  type: TActionType,
  ...[payload]: void extends TActionRecord[TActionType] ? [] : [payload: TActionRecord[TActionType]]
) => void;
```

### dispatch.subset

```ts
export type Dispatcher<ActionRecord> = DispatchFn<ActionRecord> & {
  subset: <Action extends keyof ActionRecord>(
    this: DispatchFn<ActionRecord>,
    actions: Action[]
  ) => SubDispatcher<ActionRecord, Action>;
};

export type SubDispatcher<ActionRecord, Action extends keyof ActionRecord> = DispatchFn<
  Pick<ActionRecord, Action>
> & {
  subset: <SubAction extends Action>(
    this: DispatchFn<Pick<ActionRecord, Action>>,
    actions: SubAction[]
  ) => SubDispatcher<ActionRecord, SubAction>;
};
```

The `dispatch.subset` function is a helper function that accepts an array of action types and returns a dispatch function that only accepts this defined subset of actions.

This is useful for passing dispatch functions to components that should only be able to dispatch a subset of actions.

Passing an action type that is not defined in the subset throws an error at runtime and a typescript error at compile time.

```ts
const [store, dispatch] = createReducer(reducer, { count: 0, text: "" });

const dispatchCount = dispatch.subset(["increment", "decrement"]);

dispatchCount("increment");
dispatchCount("decrement");
dispatchCount("setText"); // throws Error: 'Action "setText" not allowed from this dispatcher'
// Typescript Error: 'Argument of type "setText" is not assignable to parameter of type "increment" | "decrement"'.
```

The `dispatch.subset` function can be chained to create a subset from a subset with any depth.

```ts
const dispatchCount = dispatch.subset(["increment", "decrement"]);

const dispatchIncrement = dispatchCount.subset(["increment"]);

dispatchIncrement("increment");
dispatchIncrement("decrement"); // throws Error: 'Action "decrement" not allowed from this dispatcher'
// Typescript Error: 'Argument of type "decrement" is not assignable to parameter of type "increment"'.
```

If you want to pass a subset of actions to a component, you can use the `subset` function in the component's `setup` function.

```tsx
const Component = () => {
  const [store, dispatch] = createReducer(reducer, { count: 0, text: "" });
  const dispatchCount = dispatch.subset(["increment", "decrement"]);

  return <Child dispatch={dispatchCount} />;
};

const Child = (props: { dispatch: SubDispatcher<ActionRecord, "increment" | "decrement"> }) => {
  return <button onClick={() => props.dispatch("increment")}>Increment</button>;
};
```

If you want the type-safety of a subset, but not the runtime implications, you can just assign the dispatch function to a variable with a `SubDispatcher` type.

```ts
const [store, dispatch] = createReducer(reducer, { count: 0, text: "" });
const dispatchCount: SubDispatcher<ActionRecord, "increment" | "decrement"> = dispatch;

dispatchIncrement("increment");
dispatchIncrement("decrement");
dispatchIncrement("setText"); // does not throw Error at runtime
// Typescript Error: 'Argument of type "setText" is not assignable to parameter of type "increment" | "decrement"'.
```

You can use the `SubDispatcher` type on the props of a component to get type-safety and pass the full dispatch function directly.

```tsx
const Component = () => {
  const [store, dispatch] = createReducer(reducer, { count: 0, text: "" });

  return <Child dispatch={dispatch} />;
};

const Child = (props: { dispatch: SubDispatcher<ActionRecord, "increment" | "decrement"> }) => {
  return <button onClick={() => props.dispatch("increment")}>Increment</button>;
};
```
