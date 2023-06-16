import { createRoot } from "solid-js"
import { SetStoreFunction } from "solid-js/store"
import { describe, expect, test } from "vitest"
import { createReducer } from "../src"

type Todo = {
  id: number
  text: string
  done: boolean
}

type Store = {
  count: number
  name: string
  todos: Todo[]
}

describe("createReducer", () => {
  test("reducer works", () =>
    createRoot(dispose => {
      function reducer(set: SetStoreFunction<Store>) {
        return {
          increment: () => set("count", c => c + 1),
          decrement: () => set("count", c => c - 1),
          setName: (name: string) => set("name", name),
          add: (todo: Todo) => set("todos", todos => [...todos, todo]),
          remove: (id: number) =>
            set("todos", todos => todos.filter(todo => todo.id !== id)),
          toggle: (id: number) =>
            set(
              "todos",
              todo => todo.id === id,
              "done",
              done => !done
            ),
          reset: () => set(initialValue),
        }
      }

      const initialValue: Store = {
        count: 0,
        name: "foo",
        todos: [],
      }
      const [store, dispatch] = createReducer(reducer, initialValue)

      expect(store).toEqual(initialValue)
      dispatch("increment")
      expect(store.count).toBe(1)
      dispatch("decrement")
      expect(store.count).toBe(0)
      dispatch("setName", "bar")
      expect(store.name).toBe("bar")
      dispatch("add", { id: 1, text: "foo", done: false })
      expect(store.todos).toEqual([{ id: 1, text: "foo", done: false }])
      dispatch("add", { id: 2, text: "bar", done: false })
      expect(store.todos).toEqual([
        { id: 1, text: "foo", done: false },
        { id: 2, text: "bar", done: false },
      ])
      dispatch("remove", 1)
      expect(store.todos).toEqual([{ id: 2, text: "bar", done: false }])
      dispatch("toggle", 2)
      expect(store.todos).toEqual([{ id: 2, text: "bar", done: true }])
      dispatch("reset")
      expect(store).toEqual(initialValue)

      dispose()
    }))
})
