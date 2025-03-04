/** @import {CombatantGroupData} from "../../../foundry/common/types.mjs"; */

export class DrawSteelCombatantGroup extends CombatantGroup {
  /**
     * Present a Dialog form to create a new Document of this type.
     * Choose a name and a type from a select menu of types.
     * @param {CombatantGroupData} data                Document creation data
     * @param {DatabaseCreateOperation} [createOptions]  Document creation options.
     * @param {object} [context={}]        Options forwarded to DialogV2.prompt
     * @param {string[]} [context.types]   A restriction of the selectable sub-types of the Dialog.
     * @param {string} [context.template]  A template to use for the dialog contents instead of the default.
     * @returns {Promise<Document|null>}   A Promise which resolves to the created Document, or null if the dialog was
     *                                     closed.
     * @override Adapted from 13.337 function
     */
  static async createDialog(data = {}, createOptions = {}, {types, template, ...dialogOptions} = {}) {
    const applicationOptions = {
      top: "position", left: "position", width: "position", height: "position", scale: "position", zIndex: "position",
      title: "window", id: "", classes: "", jQuery: ""
    };

    const cls = this.implementation;

    const {parent, pack} = createOptions;
    if (types?.length === 0) throw new Error("The array of sub-types to restrict to must not be empty");

    const documentTypes = [];
    let defaultType = CONFIG[this.documentName]?.defaultType;
    let defaultTypeAllowed = false;
    const hasTypes = true;

    // Register supported types
    for (const type of this.TYPES) {
      if (types && !types.includes(type)) continue;
      let label = CONFIG[this.documentName]?.typeLabels?.[type];
      label = label && game.i18n.has(label) ? game.i18n.localize(label) : type;
      documentTypes.push({value: type, label});
      if (type === defaultType) defaultTypeAllowed = true;
    }
    if (!documentTypes.length) throw new Error("No document types were permitted to be created");
    if (!defaultTypeAllowed) defaultType = documentTypes[0].value;
    // Sort alphabetically
    documentTypes.sort((a, b) => a.label.localeCompare(b.label, game.i18n.lang));

    // Identify destination collection
    let collection;
    if (!parent) {
      if (pack) collection = game.packs.get(pack);
      else collection = game.collections.get(this.documentName);
    }

    // Collect Data
    const label = game.i18n.localize(this.metadata.label);
    const title = game.i18n.format("DOCUMENT.Create", {type: label});
    const type = data.type || defaultType;

    // Render the document creation form
    template ??= "templates/sidebar/document-create.html";
    const html = await renderTemplate(template, {
      hasTypes, type,
      name: data.name || "",
      defaultName: cls.defaultName({type, parent, pack}),
      folder: data.folder,
      hasFolders: false,
      types: documentTypes
    });

    // Render the confirmation dialog window
    return foundry.applications.api.DialogV2.prompt(foundry.utils.mergeObject({
      content: html,
      window: {title},
      position: {width: 360},
      render: (event, dialog) => {
        if (!hasTypes) return;
        dialog.querySelector("[name=\"type\"]").addEventListener("change", e => {
          const nameInput = dialog.querySelector("[name=\"name\"]");
          nameInput.placeholder = cls.defaultName({type: e.target.value, parent, pack});
        });
      },
      ok: {
        label: title,
        callback: (event, button) => {
          const fd = new FormDataExtended(button.form);
          foundry.utils.mergeObject(data, fd.object);
          if (!data.folder) delete data.folder;
          if (!data.name?.trim()) data.name = cls.defaultName({type: data.type, parent, pack});
          return cls.create(data, {renderSheet: true, ...createOptions});
        }
      }
    }, dialogOptions));
  }
}
