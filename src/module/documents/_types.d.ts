import {
  ActiveEffectData,
  ActorData,
  ChatMessageData,
  CombatantData,
  CombatData,
  ItemData,
  JournalEntryPageData
} from "../../../foundry/common/types.mjs";
import Collection from "../../../foundry/common/utils/collection.mjs";
import {
  ActiveEffect as ActiveEffectModels,
  Actor as ActorModels,
  ChatMessage as ChatMessageModels,
  Combat as CombatModels,
  Combatant as CombatantModels,
  Item as ItemModels
} from "../data/_module.mjs";
import {
  DrawSteelActiveEffect,
  DrawSteelCombatant,
  DrawSteelItem
} from "./_module.mjs";

// Collator for the types
type ActorModel = typeof ActorModels[Exclude < keyof typeof ActorModels, "BaseActorModel" > ];
type ItemModel = typeof ItemModels[Exclude < keyof typeof ItemModels, "BaseItemModel" | "AdvancementModel" > ];

declare module "../../../foundry/client/documents/_module.mjs" {
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
  interface ChatMessage extends ChatMessageData {
    type: "base" | "abilityUse";
    system: ChatMessageModels.BaseMessageModel | ChatMessageModels.AbilityUseModel;
  }

  interface Combat extends CombatData {
    type: "base";
    system: CombatModels.BaseCombatModel;
    combatants: Collection < string,
    DrawSteelCombatant > ;
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
