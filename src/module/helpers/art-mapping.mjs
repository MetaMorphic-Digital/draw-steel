/**
 * @import Document from "@common/abstract/document.mjs";
 * @import {ActorData} from "@common/documents/_types.mjs";
 * @import { CompendiumArtInfo } from "@client/helpers/_types.mjs"
 * @import CompendiumCollection from "@client/documents/collections/compendium-collection.mjs";
 */

/**
 * A hook even that fires when package-provided art is applied to a compendium Document.
 * @param {typeof Document} documentClass  The Document class.
 * @param {ActorData} source               The Document's source data.
 * @param {CompendiumCollection} pack      The Document's compendium.
 * @param {CompendiumArtInfo} art          The art being applied.
 */
export function applyCompendiumArt(documentClass, source, pack, art) {
  if (documentClass.documentName !== "Actor") return;
  if (art.avatarProperties) foundry.utils.setProperty(source, "flags.draw-steel.avatarProperties", art.avatarProperties);
}
