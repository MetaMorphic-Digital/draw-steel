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

declare module "./ability.mjs" {
  export default interface AbilityModel {
    description: {
      value: string;
      gm: string;
      flavor: string;
    }
  }
}

declare module "./ancestry.mjs" {
  export default interface AncestryModel {}
}

declare module "./career.mjs" {
  export default interface CareerModel {}
}

declare module "./class.mjs" {
  export default interface ClassModel {}
}

declare module "./complication.mjs" {
  export default interface ComplicationModel {}
}

declare module "./culture.mjs" {
  export default interface CultureModel {}
}

declare module "./equipment.mjs" {
  export default interface EquipmentModel {}
}

declare module "./feature.mjs" {
  export default interface FeatureModel {}
}

declare module "./kit.mjs" {
  export default interface KitModel {}
}

declare module "./title.mjs" {
  export default interface TitleModel {}
}
