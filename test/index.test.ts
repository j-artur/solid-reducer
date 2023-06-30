import { describe, expect, test } from "vitest"
import { Reducer, createReducer } from "../src"

type Todo = {
  id: number
  text: string
  done: boolean
}

type ActionMap = {
  increment: void
  decrement: void
  setName: string
  addTodo: Todo
  removeTodo: number
  toggleTodo: number
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

const reducer: Reducer<Store, ActionMap> = (_, set) => {
  return {
    increment: () => set("count", c => c + 1),
    decrement: () => set("count", c => c - 1),
    setName: name => set("name", name),
    addTodo: todo => set("todos", todos => [...todos, todo]),
    removeTodo: id =>
      set("todos", todos => todos.filter(todo => todo.id !== id)),
    toggleTodo: id =>
      set(
        "todos",
        todo => todo.id === id,
        "done",
        done => !done
      ),
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
    dispatch("addTodo", { id: 1, text: "foo", done: false })
    expect(store.todos).toEqual([{ id: 1, text: "foo", done: false }])
    dispatch("addTodo", { id: 2, text: "bar", done: false })
    expect(store.todos).toEqual([
      { id: 1, text: "foo", done: false },
      { id: 2, text: "bar", done: false },
    ])
    dispatch("removeTodo", 1)
    expect(store.todos).toEqual([{ id: 2, text: "bar", done: false }])
    dispatch("toggleTodo", 2)
    expect(store.todos).toEqual([{ id: 2, text: "bar", done: true }])
    dispatch("reset")
    expect(store).toEqual(initialValue)
  })

  test("subset works", () => {
    const [store, dispatch] = createReducer(reducer, { ...initialValue })

    const todoDispatch = dispatch.subset(["addTodo", "removeTodo"])

    todoDispatch("addTodo", { id: 2, text: "baz", done: false })
    expect(store.todos).toEqual([{ id: 2, text: "baz", done: false }])
    expect(() => (todoDispatch as typeof dispatch)("increment")).toThrow(
      'Action "increment" not allowed from this dispatcher'
    )
  })

  test("subset works with nested reducers", () => {
    const [store, dispatch] = createReducer(reducer, { ...initialValue })

    const todoDispatch = dispatch.subset(["addTodo", "removeTodo"])

    const todoDispatch2 = todoDispatch.subset(["addTodo"])

    todoDispatch2("addTodo", { id: 3, text: "qux", done: false })
    expect(store.todos).toEqual([{ id: 3, text: "qux", done: false }])
    expect(() =>
      (todoDispatch2 as typeof todoDispatch)("removeTodo", 3)
    ).toThrow('Action "removeTodo" not allowed from this dispatcher')
  })
})
