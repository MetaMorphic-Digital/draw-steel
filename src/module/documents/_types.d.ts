import { JournalEntryCategory } from "@client/documents/_module.mjs";
import {
  ActiveEffectData,
  ActorData,
  ChatMessageData,
  CombatantData,
  CombatantGroupData,
  CombatData,
  ItemData,
  JournalEntryPageData,
  JournalEntryData,
  SceneData,
  TokenData,
  UserData,
  WallData,
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
  JournalEntryPage as JEPModels,
} from "../data/_module.mjs";
import { DrawSteelActiveEffect, DrawSteelCombatantGroup, DrawSteelCombatant, DrawSteelItem, DrawSteelJournalEntryPage } from "./_module.mjs";

// Collator for the types
type ActiveEffectModel = typeof ActiveEffectModels[keyof typeof ActiveEffectModels];
type ActorModel = typeof ActorModels[Exclude<keyof typeof ActorModels, "BaseActorModel" | "CreatureModel">];
type ItemModel = typeof ItemModels[Exclude<keyof typeof ItemModels, "BaseItemModel" | "AdvancementModel">];
type MessageModel = typeof ChatMessageModels[Exclude<keyof typeof ChatMessageModels, "parts">];
type CombatantGroupModel = typeof CombatantGroupModels[keyof typeof CombatantGroupModels];
type JournalEntryPageModel = typeof JEPModels[keyof typeof JEPModels];

type ClientDocument = ReturnType<typeof foundry.documents.abstract.ClientDocumentMixin>;

declare module "@client/documents/_module.mjs" {
  interface BaseActiveEffect<Model extends ActiveEffectModel = ActiveEffectModel> extends ActiveEffectData, InstanceType<ClientDocument> {
    type: Model["metadata"]["type"];
    system: InstanceType<Model>;
  }

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

  interface BaseJournalEntry extends JournalEntryData, InstanceType<ClientDocument> {
    pages: Collection<string, DrawSteelJournalEntryPage>;
    categories: Collection<string, JournalEntryCategory>;
  }

  interface BaseJournalEntryPage<Model extends JournalEntryPageModel = JournalEntryPageModel> extends JournalEntryPageData, InstanceType<ClientDocument> {
    type: Model["metadata"]["type"];
    system: InstanceType<Model>;
  }

  interface BaseScene extends SceneData, InstanceType<ClientDocument> {}

  interface BaseToken extends TokenData, InstanceType<ClientDocument> {}

  interface BaseUser extends UserData, InstanceType<ClientDocument> {}

  interface BaseWall extends WallData, InstanceType<ClientDocument> {}
}
