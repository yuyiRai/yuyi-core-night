import { List } from "./ListStore";
import { Utils } from "@/utils";
import { IKeyValueMap } from "mobx";

describe("mobx array-test", () => {
  let list = new List<IKeyValueMap>([], null, true);
  beforeEach(fn => {
    // console.log('each')
    // list = new List([], null, true)
    list.registerOnArrayChange(jest.fn());
    fn();
  });
  it("push", async () => {
    console.log("push start");
    expect(list.watcherLength).toBe(0);
    list.push({ i: 0 });
    expect(list.watcherLength).toBe(1);
    list.push({ i: 1 });
    expect(list.onArrayChange).toBeCalledTimes(2);
    expect(list.watcherLength).toBe(2);
    return;
  });
  it("set", async () => {
    console.log("set start");
    expect(list.watcherLength).toBe(2);
    list.set(3, { i: 0 });
    expect(list.watcherLength).toBe(4);
    expect(list.onArrayChange).toBeCalledTimes(1);
    return;
  });
  it("pop", async () => {
    // console.log("set start");
    expect(list.watcherLength).toBe(4);
    list.pop();
    expect(list.watcherLength).toBe(3);
    expect(list.onArrayChange).toBeCalledTimes(1);
    return;
  });

  it("set by immer mode", async () => {
    expect(list.watcherLength).toBe(3);
    const r = list.set(2, (i: any) => {
      return Object.assign({}, i, { i: 2 });
    });
    expect(list.watcherLength).toBe(3);
    expect(list.onArrayChange).toBeCalledTimes(1);
    expect(r).toEqual({ i: 2 });
    return;
  });

  it("get, inner set(not reaction)", async () => {
    list.getOriginal(3, { i: 0 }).i = 3;
    expect(list.onArrayChange).toBeCalledTimes(0);
    expect(list.watcherLength).toBe(3);
    return;
  });
  it("get, inner set(has reaction)", async () => {
    const first = list.first;
    const last = list.last;
    list.getOriginal(3, { i: 0 }, true).i = 3;
    await Utils.waitingPromise(0, 0);
    expect(list.watcherLength).toBe(4);
    expect(list.onArrayChange).toBeCalledTimes(2);
    expect(list.first).toBe(first);
    expect(list.last).not.toBe(last);
    // console.log(list.first, list.last);
    return;
  });

  it("get, equals", async () => {
    console.log("set equals");
    expect(list.first).toBe(list.first);
    return;
  });

  it("all test", async () => {
    list.push({ b: { a: 1 } });
    list.set(4, item => {
      item.b.a = 5;
      return item;
    });
    list.set(10, { i: 10 });
    expect(list.transformList.length).toMatchInlineSnapshot(`11`);
    list.pop();
    expect(list.transformList.length).toMatchInlineSnapshot(`10`);
    list.pop();
    list.set(5, { i: 5 });
    expect(list.getOriginalValue(2)).toMatchInlineSnapshot(`
      Object {
        "i": 2,
      }
    `);
    expect(list.watcherLength).toMatchInlineSnapshot(`9`);
    expect(list.transformList.length).toMatchInlineSnapshot(`9`);
    expect(list.transformList).toMatchInlineSnapshot(`
      Array [
        Object {
          "i": 0,
        },
        Object {
          "i": 1,
        },
        Object {
          "i": 2,
        },
        Object {
          "i": 3,
        },
        Object {
          "b": Object {
            "a": 5,
          },
        },
        Object {
          "i": 5,
        },
        undefined,
        undefined,
        undefined,
      ]
    `);
    return;
  });
});
