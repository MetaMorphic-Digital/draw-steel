import {
  ActiveEffectData,
  ActorData,
  ChatMessageData,
  CombatantData,
  CombatantGroupData,
  CombatData,
  ItemData,
  JournalEntryPageData
} from "../../../foundry/common/types.mjs"
import Collection from "../../../foundry/common/utils/collection.mjs"
import {
  ActiveEffect as ActiveEffectModels,
  Actor as ActorModels,
  ChatMessage as ChatMessageModels,
  Combat as CombatModels,
  Combatant as CombatantModels,
  CombatantGroup as CombatantGroupModels,
  Item as ItemModels
} from "../data/_module.mjs"
import { DrawSteelActiveEffect } from "./active-effect.mjs"
import DrawSteelCombatantGroup from "./combatant-group.mjs"
import { DrawSteelCombatant } from "./combatant.mjs"
import { DrawSteelItem } from "./item.mjs"

// Collator for the types
type ActorModel = typeof ActorModels[Exclude<keyof typeof ActorModels, "BaseActorModel">];
type ItemModel = typeof ItemModels[Exclude<keyof typeof ItemModels, "BaseItemModel" | "AdvancementModel">];
type MessageModel = typeof ChatMessageModels[keyof typeof ChatMessageModels];

declare global {
  interface Actor < Model extends ActorModel = ActorModel > extends ActorData {
    type: Model["metadata"]["type"];
    system: InstanceType < Model > ;
    items: Collection < string,
    DrawSteelItem > ;
    effects: Collection < string,
    DrawSteelActiveEffect > ;
  }

  interface Item < Model extends ItemModel = ItemModel > extends ItemData {
    type: Model["metadata"]["type"];
    system: InstanceType < Model > ;
    effects: Collection < string,
    DrawSteelActiveEffect > ;
  }

  interface ActiveEffect extends ActiveEffectData {
    type: "base";
    system: ActiveEffectModels.BaseEffectModel;
  }
  interface ChatMessage<Model extends MessageModel = MessageModel> extends ChatMessageData {
    type: Model["metadata"]["type"];
    system: InstanceType<Model>;
  }

  interface Combat extends CombatData {
    type: "base";
    system: CombatModels.BaseCombatModel;
    combatants: Collection<string, DrawSteelCombatant>;
    groups: Collection<string, DrawSteelCombatantGroup>
  }

  interface CombatantGroup extends CombatantGroupData {
    type: "base" | "";
    system: CombatantGroupModels.BaseCombatantGroupModel | CombatantGroupModels.SquadModel;
  }

  interface Combatant extends CombatantData {
    type: "base";
    system: CombatantModels.BaseCombatantModel;
  }

  interface JournalEntryPage extends JournalEntryPageData {
    type: "text" | "image" | "pdf" | "video";
    system: Record < string,
    unknown > ;
  }
}
