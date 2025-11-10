/**
 * Updates a document to match the compendium copy.
 * @param {foundry.abstract.Document} doc  The root document being updated.
 * @param {object} [options={}]
 * @param {string}  [options.uuid]         An optional reference for a UUID to use in place of the stored compendiumSource.
 * @param {boolean} [options.skipDialog]   Whether to skip the confirmation dialog.
 * @param {boolean} [options.embedOnly]    Whether to only process updates for embedded documents and not this one.
 * TODO: Update to use batched operations in v14.
 */
export default async function updateFromCompendium(doc, options = {}) {
  const uuid = options.uuid ?? doc._stats.compendiumSource;

  const compendiumDocument = await fromUuid(uuid);

  if (!compendiumDocument) throw new Error("Failed to find the source document!");

  if (!options.skipDialog) {
    const content = document.createElement("div");

    content.insertAdjacentHTML("afterbegin", `<p>${
      game.i18n.format("DRAW_STEEL.SOURCE.CompendiumSource.UpdateFrom.Content", { name: doc.name })
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

  if (!options.embedOnly) await doc.update(compendiumUpdateData(compendiumDocument));

  for (const [field, collection] of Object.entries(compendiumDocument.collections)) {
    const toCreate = [];
    const toUpdate = [];
    const toDelete = new Set(doc[field].map(d => d.id));
    for (const original of collection) {
      toDelete.delete(original.id);
      const currentEntry = doc[field].get(original.id);
      if (currentEntry) {
        toUpdate.push(compendiumUpdateData(original));

        // This specifically will get refactored in the batch update improvements
        await updateFromCompendium(currentEntry, { skipDialog: true, uuid: original.uuid, embedOnly: true });
      }
      // Items does not alter WorldCollection#fromCompendium
      else toCreate.push(game.items.fromCompendium(original));
    }
    await doc.createEmbeddedDocuments(collection.documentName, toCreate);
    await doc.updateEmbeddedDocuments(collection.documentName, toUpdate);
    await doc.deleteEmbeddedDocuments(collection.documentName, Array.from(toDelete));
  }

  ui.notifications.success("DRAW_STEEL.SOURCE.CompendiumSource.UpdateFrom.Completion", { format: { name: doc.name } });
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
      // Preserve project point usage
      if (doc.type === "career") delete documentData.system.projectPoints;
      // Preserve class level
      else if (doc.type === "class") delete documentData.system.level;
      // Preserve current project completion status
      else if (doc.type === "project") delete documentData.system.points;
      return { _id: doc.id, "==system": documentData.system };
    case "ActiveEffect":
      return {
        _id: doc.id,
        "==system": documentData.system,
        duration: documentData.duration,
        changes: documentData.changes,
        description: documentData.description,
      };
  }
}
