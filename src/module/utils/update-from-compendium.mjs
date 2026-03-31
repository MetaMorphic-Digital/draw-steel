/**
 * @import { DatabaseWriteOperation } from "@common/abstract/_types.mjs";
 * @import EmbeddedCollection from "@common/abstract/embedded-collection.mjs";
 */

/**
 * Updates a document to match the compendium copy.
 * @param {foundry.abstract.Document} doc  The root document being updated.
 * @param {object} [options={}]
 * @param {string}  [options.uuid]         An optional reference for a UUID to use in place of the stored compendiumSource.
 * @param {boolean} [options.skipDialog]   Whether to skip the confirmation dialog.
 * @returns {foundry.abstract.Document[][]} The successful batched operation
 */
export default async function updateFromCompendium(doc, options = {}) {
  const uuid = options.uuid ?? doc._stats.compendiumSource;

  const compendiumDocument = await fromUuid(uuid);

  if (!compendiumDocument) throw new Error("Failed to find the source document!");

  if (!options.skipDialog) {
    const content = document.createElement("div");

    content.insertAdjacentHTML("afterbegin", `<p>${
      _loc("DRAW_STEEL.SOURCE.CompendiumSource.UpdateFrom.Content", { name: doc.name })
    }</p>`);

    const proceed = await ds.applications.api.DSDialog.confirm({
      content,
      window: {
        title: "DRAW_STEEL.SOURCE.CompendiumSource.UpdateFrom.Title",
        icon: "fa-solid fa-file-arrow-down",
      },
    });

    if (!proceed) return;
  }

  const sourceUpdateData = compendiumUpdateData(compendiumDocument);
  sourceUpdateData._id = doc.id;

  /** @type {DatabaseWriteOperation[]} */
  const operation = [{
    updates: [sourceUpdateData],
    action: "update",
    documentName: doc.documentName,
    parent: doc.parent,
  }];

  const savedProps = {};
  switch (doc.type) {
    case "career":
      savedProps["system.projectPoints"] = doc.system.projectPoints;
      break;
    case "class":
      savedProps["system.level"] = doc.system.level;
      break;
    case "project":
      savedProps["system.points"] = doc.system.points;
      break;
  }

  Object.entries(compendiumDocument.collections).forEach(([field, collection]) => gatherCollectionUpdates(operation, collection, doc[field]));

  console.log(operation);

  const result = await foundry.documents.modifyBatch(operation);

  if (!foundry.utils.isEmpty(savedProps)) await doc.update(savedProps);

  if (result) ui.notifications.success("DRAW_STEEL.SOURCE.CompendiumSource.UpdateFrom.Completion", { format: { name: doc.name } });
  else ui.notifications.error("DRAW_STEEL.SOURCE.CompendiumSource.UpdateFrom.Failure", { format: { name: doc.name } });
  return result;
}

/**
 * Produces a data object for updating a document to match its compendium version.
 * @param {foundry.abstract.Document} doc
 */
function compendiumUpdateData(doc) {
  const documentData = doc.toObject();
  switch (doc.documentName) {
    case "Actor":
    case "Item":
      return { _id: doc.id, system: _replace(documentData.system) };
    case "ActiveEffect":
      return {
        _id: doc.id,
        system: _replace(documentData.system),
        duration: documentData.duration,
        description: documentData.description,
      };
  }
}

/**
 * Helper function to fill in the operation for a pair of collections.
 * @param {DatabaseWriteOperation[]} operation      The operation to push to.
 * @param {EmbeddedCollection} originalCollection   An embedded collection from the compendium document.
 * @param {EmbeddedCollection} currentCollection    The document being updated's embedded collection.
 */
function gatherCollectionUpdates(operation, originalCollection, currentCollection) {
  const toCreate = [];
  const toUpdate = [];
  const toDelete = new Set(currentCollection.map(d => d.id));
  for (const original of originalCollection) {
    toDelete.delete(original.id);
    const currentEntry = currentCollection.get(original.id);
    if (currentEntry) {
      toUpdate.push(compendiumUpdateData(original));

      Object.entries(original.collections).forEach(([field, collection]) => gatherCollectionUpdates(operation, collection, currentEntry[field]));
    }
    // Items does not alter WorldCollection#fromCompendium
    // TODO: Fix how this handles Active Effects
    else toCreate.push(game.items.fromCompendium(original, { keepId: true, clearOwnership: false }));
  }
  const documentName = originalCollection.documentName;
  operation.push(
    {
      documentName,
      action: "create",
      parent: currentCollection.model,
      data: toCreate,
    },
    {
      documentName,
      action: "update",
      parent: currentCollection.model,
      updates: toUpdate,
    },
    {
      documentName,
      action: "delete",
      parent: currentCollection.model,
      ids: Array.from(toDelete),
    },
  );
}
