import { describe, expect, test } from "vitest"
import { NestedRecord, Reducer, createReducer } from "../src"

type Todo = {
  id: number
  text: string
  done: boolean
}

type ActionRecord = {
  increment: void
  decrement: void
  setName: string
  todos: NestedRecord<{
    add: Todo
    remove: number
    toggle: number
    nested: NestedRecord<{
      test: void
    }>
  }>
  reset: void
}

type Store = {
  count: number
  name: string
  todos: Todo[]
}

const initialValue: Store = {
  count: 0,
  name: "foo",
  todos: [],
}

const reducer: Reducer<Store, ActionRecord> = (_, set) => {
  return {
    increment: () => set("count", c => c + 1),
    decrement: () => set("count", c => c - 1),
    setName: name => set("name", name),
    todos: {
      add: todo => set("todos", todos => [...todos, todo]),
      remove: id => set("todos", todos => todos.filter(todo => todo.id !== id)),
      toggle: id =>
        set(
          "todos",
          todo => todo.id === id,
          "done",
          done => !done
        ),
      nested: {
        test: () => set("count", c => c + 1),
      },
    },
    reset: () =>
      set({
        count: 0,
        name: "foo",
        todos: [],
      }),
  }
}

describe("createReducer", () => {
  test("reducer works", () => {
    const [store, dispatch] = createReducer(reducer, { ...initialValue })

    expect(store).toEqual(initialValue)
    dispatch("increment")
    expect(store.count).toBe(1)
    dispatch("decrement")
    expect(store.count).toBe(0)
    dispatch("setName", "bar")
    expect(store.name).toBe("bar")
    dispatch("todos.add", { id: 1, text: "foo", done: false })
    expect(store.todos).toEqual([{ id: 1, text: "foo", done: false }])
    dispatch("todos.add", { id: 2, text: "bar", done: false })
    expect(store.todos).toEqual([
      { id: 1, text: "foo", done: false },
      { id: 2, text: "bar", done: false },
    ])
    dispatch("todos.remove", 1)
    expect(store.todos).toEqual([{ id: 2, text: "bar", done: false }])
    dispatch("todos.toggle", 2)
    expect(store.todos).toEqual([{ id: 2, text: "bar", done: true }])
    dispatch("reset")
    expect(store).toEqual(initialValue)
  })

  test("unknown action type throws", () => {
    const [, dispatch] = createReducer(reducer, { ...initialValue })

    expect(() => dispatch("foo" as any)).toThrow('Action "foo" not found')
  })
})

describe("dispatch.prefix", () => {
  test("prefix works", () => {
    const [store, dispatch] = createReducer(reducer, { ...initialValue })

    const todoDispatch = dispatch.prefix("todos")

    todoDispatch("add", { id: 2, text: "baz", done: false })
    expect(store.todos).toEqual([{ id: 2, text: "baz", done: false }])
    todoDispatch("nested.test")
    expect(store.count).toBe(1)
  })

  test("prefix throws on not-allowed action type", () => {
    const [, dispatch] = createReducer(reducer, { ...initialValue })

    const todoDispatch = dispatch.prefix("todos")

    expect(() => todoDispatch("increment" as any)).toThrow(
      'Action "increment" not found'
    )
  })

  test("prefix works with nested prefixes", () => {
    const [store, dispatch] = createReducer(reducer, { ...initialValue })

    const todoDispatch = dispatch.prefix("todos")

    const todoDispatch2 = todoDispatch.prefix("nested")

    todoDispatch2("test")
    expect(store.count).toBe(1)
  })

  test("prefix works with subset", () => {
    const [store, dispatch] = createReducer(reducer, { ...initialValue })

    const todoDispatch = dispatch.prefix("todos")

    const todoDispatch2 = todoDispatch.subset(["nested"])

    todoDispatch2("nested.test")
    expect(store.count).toBe(1)
  })

  test("prefixed subset throws on not-allowed action type", () => {
    const [, dispatch] = createReducer(reducer, { ...initialValue })

    const todoDispatch = dispatch.prefix("todos")

    const todoDispatch2 = todoDispatch.subset(["nested"])

    expect(() => todoDispatch2("add" as any)).toThrow('Action "add" not found')
  })
})

describe("dispatch.subset", () => {
  test("subset works", () => {
    const [store, dispatch] = createReducer(reducer, { ...initialValue })

    const todoDispatch = dispatch.subset(["todos"])

    todoDispatch("todos.add", { id: 2, text: "baz", done: false })
    expect(store.todos).toEqual([{ id: 2, text: "baz", done: false }])
    expect(() => (todoDispatch as typeof dispatch)("increment")).toThrow(
      'Action "increment" not found'
    )
  })

  test("subset throws on not-allowed action type", () => {
    const [, dispatch] = createReducer(reducer, { ...initialValue })

    const todoDispatch = dispatch.subset(["todos"])

    expect(() => todoDispatch("increment" as any)).toThrow(
      'Action "increment" not found'
    )
  })

  test("subset works with nested subsets", () => {
    const [store, dispatch] = createReducer(reducer, { ...initialValue })

    const todoDispatch = dispatch.subset(["todos"])

    const todoDispatch2 = todoDispatch.subset(["todos.add"])

    todoDispatch2("todos.add", { id: 3, text: "qux", done: false })
    expect(store.todos).toEqual([{ id: 3, text: "qux", done: false }])
  })
})
