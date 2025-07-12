import {
  ActiveEffectData,
  ActorData,
  ChatMessageData,
  CombatantData,
  CombatantGroupData,
  CombatData,
  ItemData,
  JournalEntryPageData,
  TokenData,
} from "@common/documents/_types.mjs";
import Collection from "@common/utils/collection.mjs";
import {
  ActiveEffect as ActiveEffectModels,
  Actor as ActorModels,
  ChatMessage as ChatMessageModels,
  Combat as CombatModels,
  Combatant as CombatantModels,
  CombatantGroup as CombatantGroupModels,
  Item as ItemModels,
} from "../data/_module.mjs";
import { DrawSteelActiveEffect, DrawSteelCombatantGroup, DrawSteelCombatant, DrawSteelItem } from "./_module.mjs";

// Collator for the types
type ActorModel = typeof ActorModels[Exclude<keyof typeof ActorModels, "BaseActorModel">];
type ItemModel = typeof ItemModels[Exclude<keyof typeof ItemModels, "BaseItemModel" | "AdvancementModel">];
type MessageModel = typeof ChatMessageModels[keyof typeof ChatMessageModels];
type CombatantGroupModel = typeof CombatantGroupModels[keyof typeof CombatantGroupModels];

type ClientDocument = ReturnType<typeof foundry.documents.abstract.ClientDocumentMixin>;

declare module "@client/documents/_module.mjs" {
  interface BaseActor<Model extends ActorModel = ActorModel> extends ActorData, InstanceType<ClientDocument> {
    type: Model["metadata"]["type"];
    system: InstanceType<Model>;
    items: Collection<string, DrawSteelItem>;
    effects: Collection<string, DrawSteelActiveEffect>;
  }

  interface BaseItem<Model extends ItemModel = ItemModel> extends ItemData, InstanceType<ClientDocument> {
    type: Model["metadata"]["type"];
    system: InstanceType<Model>;
    effects: Collection<string, DrawSteelActiveEffect>;
  }

  interface BaseActiveEffect extends ActiveEffectData {
    type: "base";
    system: ActiveEffectModels.BaseEffectModel;
  }
  interface BaseChatMessage<Model extends MessageModel = MessageModel> extends ChatMessageData, InstanceType<ClientDocument> {
    type: Model["metadata"]["type"];
    system: InstanceType<Model>;
  }

  interface BaseCombat extends CombatData, InstanceType<ClientDocument> {
    type: "base";
    system: CombatModels.BaseCombatModel;
    combatants: Collection<string, DrawSteelCombatant>;
    groups: Collection<string, DrawSteelCombatantGroup>
  }

  interface BaseCombatantGroup<Model extends CombatantGroupModel = CombatantGroupModel> extends CombatantGroupData, InstanceType<ClientDocument> {
    type: Model["metadata"]["type"];
    system: InstanceType<Model>;
  }

  interface BaseCombatant extends CombatantData, InstanceType<ClientDocument> {
    type: "base";
    system: CombatantModels.BaseCombatantModel;
  }

  interface BaseJournalEntryPage extends JournalEntryPageData, InstanceType<ClientDocument> {
    type: "text" | "image" | "pdf" | "video";
    system: Record<string, unknown>;
  }
   
  interface BaseToken extends TokenData, InstanceType<ClientDocument> {}
}
