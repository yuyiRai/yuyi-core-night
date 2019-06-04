import { FormStore } from "./FormStore";

const store = new FormStore();
describe("FormStoreCore", () => {
  beforeEach(() => {
    store.setConfig([{ code: "name" }, { code: "password" }]);
  });

  it("configMap", async () => {
    const name = store.configStore.getItemConfig("name");
    store.setConfig([{ code: "name", option: [] }]);
    expect(name.options).toMatchInlineSnapshot(`Array []`);
    expect(name).toBe(store.configStore.getItemConfig("name"));
    return;
  });
});
