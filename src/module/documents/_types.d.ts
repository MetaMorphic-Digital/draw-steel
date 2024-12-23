import { ActiveEffectData, ActorData, CombatantData, CombatData, ItemData } from "../../../foundry/common/types.mjs"
import Collection from "../../../foundry/common/utils/collection.mjs"
import { ActiveEffect as ActiveEffectModel, Actor as ActorModels, Combat as CombatModel, Combatant as CombatantModel, Item as ItemModels } from "../data/_module.mjs"
import { DrawSteelActiveEffect } from "./active-effect.mjs"
import { DrawSteelItem } from "./item.mjs"

// Collator for the types
type ActorModel = typeof ActorModels[Exclude<keyof typeof ActorModels, "BaseActorModel">];
type ItemModel = typeof ItemModels[Exclude<keyof typeof ItemModels, "BaseItemModel" | "AdvancementModel">];

declare global {
  interface Actor<Model extends ActorModel = ActorModel> extends ActorData {
    type: Model["metadata"]["type"];
    system: InstanceType<Model>;
    items: Collection<string, DrawSteelItem>;
    effects: Collection<string, DrawSteelActiveEffect>;
  }

  interface Item<Model extends ItemModel = ItemModel> extends ItemData {
    type: Model["metadata"]["type"];
    system: InstanceType<Model>;
    effects: Collection<string, DrawSteelActiveEffect>;
  }

  interface ActiveEffect extends ActiveEffectData {
    type: "base";
    system: ActiveEffectModel.BaseEffectModel;
  }

  interface Combat extends CombatData {
    type: "base";
    system: CombatModel.BaseCombatModel;
  }

  interface Combatant extends CombatantData {
    type: "base";
    system: CombatantModel.BaseCombatantModel;
  }
}
