import { ActiveEffectData, ActorData, ItemData, JournalEntryPageData } from "../../../foundry/common/types.mjs"
import Collection from "../../../foundry/common/utils/collection.mjs"
import { ActiveEffect as ActiveEffectModel, Actor as ActorModels, Item as ItemModels } from "../data/_module.mjs"
import { DrawSteelActiveEffect } from "./active-effect.mjs"
import { DrawSteelItem } from "./item.mjs"

// Collator for the types
type ActorModel = typeof ActorModels[Exclude<keyof typeof ActorModels, "BaseActorModel">];
type ItemModel = typeof ItemModels[Exclude<keyof typeof ItemModels, "BaseItemModel">];

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

  interface JournalEntryPage extends JournalEntryPageData {
    type: "text" | "image" | "pdf" | "video";
    system: Record<string, unknown>;
  }
}
