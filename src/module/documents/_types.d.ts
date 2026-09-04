import {
  ActiveEffectData,
  ActorData,
  ChatMessageData,
  CombatData,
  CombatantData,
  CombatantGroupData,
  ItemData,
  JournalEntryData,
  JournalEntryPageData,
  SceneData,
  TokenData,
  UserData,
  WallData,
} from "@common/documents/_types.mjs";
import {
  ActiveEffect as ActiveEffectModels,
  Actor as ActorModels,
  ChatMessage as ChatMessageModels,
  Combat as CombatModels,
  CombatantGroup as CombatantGroupModels,
  Combatant as CombatantModels,
  Item as ItemModels,
  JournalEntryPage as JEPModels,
} from "../data/_module.mjs";
import { DrawSteelActiveEffect, DrawSteelCombatant, DrawSteelCombatantGroup, DrawSteelItem, DrawSteelJournalEntryPage, DrawSteelTokenDocument, DrawSteelWallDocument } from "./_module.mjs";
import DrawSteelToken from "../canvas/placeables/token.mjs";
import EmbeddedCollection from "@common/abstract/embedded-collection.mjs";
import { JournalEntryCategory } from "@client/documents/_module.mjs";

// Collator for the types
type ActiveEffectModel = typeof ActiveEffectModels[keyof typeof ActiveEffectModels];
type ActorModel = typeof ActorModels[Exclude<keyof typeof ActorModels, "BaseActorModel" | "CreatureModel">];
type ItemModel = typeof ItemModels[Exclude<keyof typeof ItemModels, "BaseItemModel" | "AdvancementModel">];
type MessageModel = typeof ChatMessageModels[Exclude<keyof typeof ChatMessageModels, "parts">];
type CombatantGroupModel = typeof CombatantGroupModels[keyof typeof CombatantGroupModels];
type JournalEntryPageModel = typeof JEPModels[keyof typeof JEPModels];

type ClientDocument = InstanceType<ReturnType<typeof foundry.documents.abstract.ClientDocumentMixin>>;
type CanvasDocument = ReturnType<typeof foundry.documents.abstract.CanvasDocumentMixin>;

declare module "@client/documents/_module.mjs" {
  interface BaseActiveEffect<Model extends ActiveEffectModel = ActiveEffectModel> extends ActiveEffectData, ClientDocument {
    type: Model["metadata"]["type"];
    system: InstanceType<Model>;
  }

  interface BaseActor<Model extends ActorModel = ActorModel> extends ActorData, ClientDocument {
    type: Model["metadata"]["type"];
    system: InstanceType<Model>;
    items: EmbeddedCollection<DrawSteelItem>;
    effects: EmbeddedCollection<DrawSteelActiveEffect>;
  }

  interface BaseItem<Model extends ItemModel = ItemModel> extends ItemData, ClientDocument {
    type: Model["metadata"]["type"];
    system: InstanceType<Model>;
    effects: EmbeddedCollection<DrawSteelActiveEffect>;
  }
  interface BaseChatMessage<Model extends MessageModel = MessageModel> extends ChatMessageData, ClientDocument {
    type: Model["metadata"]["type"];
    system: InstanceType<Model>;
  }

  interface BaseCombat extends CombatData, ClientDocument {
    type: "base";
    system: CombatModels.BaseCombatModel;
    combatants: EmbeddedCollection<DrawSteelCombatant>;
    groups: EmbeddedCollection<DrawSteelCombatantGroup>
  }

  interface BaseCombatantGroup<Model extends CombatantGroupModel = CombatantGroupModel> extends CombatantGroupData, ClientDocument {
    type: Model["metadata"]["type"];
    system: InstanceType<Model>;
  }

  interface BaseCombatant extends CombatantData, ClientDocument {
    type: "base";
    system: CombatantModels.BaseCombatantModel;
    group: DrawSteelCombatantGroup;
  }

  interface BaseJournalEntry extends JournalEntryData, ClientDocument {
    pages: EmbeddedCollection<DrawSteelJournalEntryPage>;
    categories: EmbeddedCollection<JournalEntryCategory>;
  }

  interface BaseJournalEntryPage<Model extends JournalEntryPageModel = JournalEntryPageModel> extends JournalEntryPageData, ClientDocument {
    type: Model["metadata"]["type"];
    system: InstanceType<Model>;
  }

  interface BaseScene extends SceneData, ClientDocument {
    tokens: EmbeddedCollection<DrawSteelTokenDocument>;
    walls: EmbeddedCollection<DrawSteelWallDocument>;
  }

  interface BaseToken extends TokenData, InstanceType<CanvasDocument> {
    object: DrawSteelToken;
  }

  interface BaseUser extends UserData, ClientDocument {}

  interface BaseWall extends WallData, InstanceType<CanvasDocument> {}
}
