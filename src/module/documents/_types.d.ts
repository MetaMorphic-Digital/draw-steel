import { ActiveEffectData, ActorData, ItemData } from "../../../foundry/common/types.mjs"
import Collection from "../../../foundry/common/utils/collection.mjs"
import { ActiveEffect as ActiveEffectModel, Actor as ActorModels, Item as ItemModels } from "../data/_module.mjs"
import { DrawSteelActiveEffect } from "./active-effect.mjs"
import { DrawSteelItem } from "./item.mjs"

declare global {
  interface Actor extends ActorData {
    type: "character" | "npc";
    system: ActorModels.CharacterModel | ActorModels.NPCModel;
    items: Collection<string, DrawSteelItem>;
    effects: Collection<string, DrawSteelActiveEffect>;
  }

  interface Item extends ItemData {
    type: "ability" | "ancestry" | "career" | "class" | "complication" | "culture" | "equipment" | "feature" | "kit" | "title";
    system: ItemModels.AbilityModel | ItemModels.AncestryModel | ItemModels.CareerModel | ItemModels.ClassModel |
      ItemModels.ComplicationModel | ItemModels.CultureModel | ItemModels.EquipmentModel | ItemModels.FeatureModel |
      ItemModels.KitModel | ItemModels.TitleModel;
    effects: Collection<string, DrawSteelActiveEffect>;
  }

  interface ActiveEffect extends ActiveEffectData {
    type: "base";
    system: ActiveEffectModel.BaseEffectModel;
  }
}

