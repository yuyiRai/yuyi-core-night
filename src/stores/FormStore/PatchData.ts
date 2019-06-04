import { FormModel } from "../../components/Form/Interface";

export type PatchData<T=FormModel> = {
  name: keyof T;
  value?: any;
  validating?: boolean;
  errors?: Error[];
};
export type PatchDataTree<T> = {
  [key: string]: PatchDataTree<T> | PatchData<T>;
};
