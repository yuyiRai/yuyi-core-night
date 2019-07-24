import { FormStore } from "./FormStore";

const store = new FormStore();
describe("FormStoreCore", () => {
  beforeEach(() => {
    store.setConfig([
      { code: "name", options: ["a", "b", "c", "d", "e", "f", "g"] },
      { code: "password" }
    ]);
  });

  it("configMap", async () => {
    const name = store.configStore.getItemConfig("name");
    expect(name).toBe(store.configStore.getItemConfig("name"));
    expect(name.options).toMatchInlineSnapshot(`
      Array [
        "a",
        "b",
        "c",
        "d",
        "e",
        "f",
        "g",
      ]
    `);
    store.setConfig([{ code: "name", option: [] }]);
    expect(name.options).toMatchInlineSnapshot(`Array []`);
    expect(name).not.toBe(store.configStore.getItemConfig("name"));
    return;
  });
});
