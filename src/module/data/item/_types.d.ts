import { DrawSteelItem } from "../../documents/item.mjs";


declare module "./base.mjs" {
  export default interface BaseItemModel {
    parent: DrawSteelItem;
    description: {
      value: string;
      gm: string;
    }
    source: {
      book: string | null;
      page: string | null;
      license: string | null;
    }
    _dsid: string | null;
  }
}
