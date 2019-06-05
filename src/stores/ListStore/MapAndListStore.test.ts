import { Utils } from "yuyi-core-utils";
import { autorun, observable, reaction } from "mobx";
import { createTransformer } from "mobx-utils";
import { IKeyData, IMapTransformer, KeyDataMapStore } from "./MapAndListStore";

console.info = () => { }
/*
      store 保存了我们的领域对象: boxes 和 arrows
    */
const store = observable({
  boxes: [],
  arrows: [],
  selection: null
});
type Store = typeof store;

/**
    每次更改会把 store 序列化成 json 并将其添加到状态列表中
  */
const states = [];

const serializeState = createTransformer((store: Store) => ({
  boxes: store.boxes.map(serializeBox),
  arrows: store.arrows.map(serializeArrow),
  selection: store.selection ? store.selection.id : null
}));

const serializeBox = createTransformer(box => ({ ...box }));

const serializeArrow = createTransformer((arrow: any) => ({
  id: arrow.id,
  to: arrow.to.id,
  from: arrow.from.id
}));

autorun(() => {
  states.push(serializeState(store));
});
function test(
  transformer: IMapTransformer<'code', IKeyData<'code'>, IKeyData<'code'>>
) {
  describe("simple test", () => {
    let map = new KeyDataMapStore<'code', IKeyData<'code'>, IKeyData<'code'>>('code', transformer);
    let object = map.sourceData;
    let view = observable({
      get name() {
        return map.targetData.name
      },
      get pwd() {
        return map.targetData.password
      }
    })
    let onNameChange, onPasswordChange, keysChange, sourceValuesChange
    reaction(() => view.name, obj => {
      onNameChange(obj)
    })
    reaction(() => view.pwd, obj => {
      onPasswordChange(obj)
    })
    reaction(() => map.keyList, obj => {
      keysChange(obj)
    })
    reaction(() => map.valueList, obj => {
      sourceValuesChange(obj)
    })
    beforeEach(() => {
      onNameChange = jest.fn(obj => console.log(obj))
      onPasswordChange = jest.fn(obj => console.log(obj))
      keysChange = jest.fn(obj => console.log(obj))
      sourceValuesChange = jest.fn(obj => console.log(obj))
    })
    it("init data", async () => {
      map.setSourceData([{ code: "name" }, { code: "password" }]);
      expect(object).not.toBe(map.sourceData);
      expect(onNameChange).toBeCalledTimes(1);
      expect(onPasswordChange).toBeCalledTimes(1);
      expect(keysChange).toBeCalledTimes(1);
      expect(sourceValuesChange).toBeCalledTimes(1)
      return
    })
    it("init equals to last data", async () => {
      object = map.sourceData;
      map.setSourceData([{ code: "name" }, { code: "password" }]);
      // expect(object).toBe(map.sourceData);
      expect(onNameChange).toBeCalledTimes(0);
      expect(onPasswordChange).toBeCalledTimes(0);
      expect(keysChange).toBeCalledTimes(0);
      expect(sourceValuesChange).toBeCalledTimes(0)
      return
    });
    it("init diff (only password) to last data", async () => {
      map.setSourceData([{ code: "name" }]);
      expect(object).not.toBe(map.sourceData);
      expect(onNameChange).toBeCalledTimes(0);
      expect(onPasswordChange).toBeCalledTimes(1);
      expect(keysChange).toBeCalledTimes(1);
      expect(sourceValuesChange).toBeCalledTimes(1)
      return
    });

    it("with", async () => {
      store.boxes.push({ a: 1 });
      store.boxes.push({ b: 2 }, { c: 3 });
      await Utils.waitingPromise(10);
      expect(states[1].boxes[0]).toBe(states[2].boxes[0]);
      return;
    });
  });
}
test({
  create(source) {
    return { code: source.code };
  },
  update({ code }, target) {;
    return {
      ...target,
      codeName: code
    };
  },
  delete(target, source) {
    console.log(target, source);
  }
})


// test({
//   create(source: IFormItemConstructor) {
//     return new ItemConfig(source, {});
//   },
//   update(source, target) {;
//     return target.setConfig(source);
//   },
//   delete(target, source) {
//     console.info(target, source);
//   }
// } as IMapTransformer<'code', IFormItemConstructor, ItemConfig>)