import DSDialog from "../applications/api/dialog.mjs";
import DrawSteelTokenDocument from "./token.mjs";

/**
 * @import { CombatantGroupData } from "@common/documents/_types.mjs";
 */

/**
 * A document subclass adding system-specific behavior and registered in CONFIG.CombatantGroup.documentClass.
 */
export default class DrawSteelCombatantGroup extends foundry.documents.CombatantGroup {

  /**
   * The default icon used for newly created CombatantGroup documents.
   * @type {string}
   */
  static DEFAULT_ICON = "icons/environment/people/charge.webp";

  /* -------------------------------------------------- */

  /**
   * Determine default artwork based on the provided combatant group data.
   * @param {CombatantGroupData} createData The source combatant group data.
   * @returns {{img: string}}               Candidate combatant group image.
   */
  static getDefaultArtwork(createData) {
    return { img: this.DEFAULT_ICON };
  }

  /* -------------------------------------------------- */

  /**
   * Present a Dialog form to create a new Document of this type.
   * Choose a name and a type from a select menu of types.
   * @param {CombatantGroupData} data                Document creation data.
   * @param {DatabaseCreateOperation} [createOptions]  Document creation options.
   * @param {object} [context={}]        Options forwarded to DialogV2.prompt.
   * @param {string[]} [context.types]   A restriction of the selectable sub-types of the Dialog.
   * @param {string} [context.template]  A template to use for the dialog contents instead of the default.
   * @returns {Promise<Document|null>}   A Promise which resolves to the created Document, or null if the dialog was
   *                                     closed.
   * @override Adapted from ClientDocumentMixin
   */
  static async createDialog(data = {}, createOptions = {}, { types, template, ...dialogOptions } = {}) {
    const cls = this.implementation;

    const { parent, pack } = createOptions;
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
      documentTypes.push({ value: type, label });
      if (type === defaultType) defaultTypeAllowed = true;
    }
    if (!documentTypes.length) throw new Error("No document types were permitted to be created");
    if (!defaultTypeAllowed) defaultType = documentTypes[0].value;
    // Sort alphabetically
    documentTypes.sort((a, b) => a.label.localeCompare(b.label, game.i18n.lang));

    // Collect Data
    const label = game.i18n.localize(this.metadata.label);
    const title = game.i18n.format("DOCUMENT.Create", { type: label });
    const type = data.type || defaultType;

    // Render the document creation form
    template ??= "templates/sidebar/document-create.html";
    const html = await foundry.applications.handlebars.renderTemplate(template, {
      hasTypes, type,
      name: data.name || "",
      defaultName: cls.defaultName({ type, parent, pack }),
      folder: data.folder,
      hasFolders: false,
      types: documentTypes,
    });

    // Render the confirmation dialog window
    return DSDialog.prompt(foundry.utils.mergeObject({
      content: html,
      window: { title },
      position: { width: 360 },
      render: (event, dialog) => {
        if (!hasTypes) return;
        /** @type {HTMLInputElement} */
        const typeInput = dialog.element.querySelector("[name=\"type\"]");
        typeInput.addEventListener("change", e => {
          const nameInput = dialog.element.querySelector("[name=\"name\"]");
          nameInput.placeholder = cls.defaultName({ type: e.target.value, parent, pack });
        });
        // On-render addition to avoid having to use a new template
        const hint = document.createElement("p");
        hint.className = "hint";
        hint.innerText = game.i18n.localize("DRAW_STEEL.CombatantGroup.TypeHint");
        const group = typeInput.closest(".form-group");
        group.append(hint);
      },
      ok: {
        label: title,
        callback: (event, button) => {
          const fd = new foundry.applications.ux.FormDataExtended(button.form);
          foundry.utils.mergeObject(data, fd.object);
          if (!data.folder) delete data.folder;
          if (!data.name?.trim()) data.name = cls.defaultName({ type: data.type, parent, pack });
          return cls.create(data, { renderSheet: true, ...createOptions });
        },
      },
    }, dialogOptions));
  }

  /* -------------------------------------------------- */

  /**
   * Creates a combat group and populates it with the combatants linked to the provided tokens.
   * @param {DrawSteelCombat} combat            The parent combat.
   * @param {DrawSteelTokenDocument[]} [tokens] The tokens to create from. Defaults to selected.
   * @returns {DrawSteelCombatantGroup}
   */
  static async createFromTokens(combat, tokens) {
    tokens ??= canvas.tokens.controlled.map(t => t.document);
    await DrawSteelTokenDocument.createCombatants(tokens);
    const combatants = tokens.map(t => t.combatant);
    const actorName = tokens[0]?.actor.name;
    const tokenImage = tokens[0].texture.src;
    const type = tokens.some(t => t.actor?.system.isMinion) ? "squad" : "base";
    const group = await this.create({
      type,
      name: tokens.every(t => t.actor?.name === actorName) ? actorName : this.defaultName({ type, parent: combat }),
      img: tokens.every(t => t.texture.src === tokenImage) ? tokenImage : null,
    }, { parent: combat });
    const updateData = combatants.map(c => ({ _id: c.id, group: group.id }));
    await combat.updateEmbeddedDocuments("Combatant", updateData);
    if (group.type === "squad") await group.update({ "system.staminaValue": group.system.staminaMax });

    return group;
  }

  /* -------------------------------------------------- */

  /**
   * Is this group currently expanded in the combat tracker?
   * @type {boolean}
   */
  _expanded = false;

  /* -------------------------------------------------- */

  /**
   * The disposition for this combatant group.
   * Returns the value for Secret if there are no members.
   * @returns {number}
   */
  get disposition() {
    return this.members.first()?.disposition ?? CONST.TOKEN_DISPOSITIONS.SECRET;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    // Provide a default image
    if (!data.img) this.updateSource(this.constructor.getDefaultArtwork(data));
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  get visible () {
    return this.isOwner || !this.hidden;
  }

  /* -------------------------------------------------- */

  /**
   * Create a dialog that prompts the user to update either the tint or ring color
   * of all tokens associated with the members of this combatant group.
   * @returns {Promise<DrawSteelTokenDocument[][]>} An array of updated token arrays.
   */
  async colorTokensDialog() {
    const content = document.createElement("div");

    const colorInput = foundry.applications.fields.createFormGroup({
      label: "DRAW_STEEL.CombatantGroup.ColorTokens.Input",
      input: foundry.applications.elements.HTMLColorPickerElement.create({
        name: "color",
      }),
      localize: true,
    });

    const swatches = document.createElement("div");

    swatches.className = "form-group color-swatches";

    for (const color of ["#FFFFFF", "#000000", "#FF0000", "#00FF00", "#0000FF", "#00FFFF", "#FF00FF", "#FFFF00"]) {
      const button = ds.utils.constructHTMLButton({
        classes: ["color-swatch"],
        dataset: {
          action: "swatchColor",
          color: color,
        },
      });

      button.style = `--swatch-color: ${color}`;

      swatches.append(button);
    }

    /**
     * Action callback for preset color swatches.
     * @this {DSDialog}
     * @param {PointerEvent} event The triggering event.
     * @param {HTMLElement} target The action target element.
     */
    function swatchColor(ev, target) {
      target.form.color.value = target.dataset.color;
    }

    content.append(colorInput, swatches);
    const fd = await DSDialog.wait({
      content,
      actions: {
        swatchColor,
      },
      classes: ["color-tokens"],
      window: {
        title: "DRAW_STEEL.CombatantGroup.ColorTokens.Title",
        icon: "fa-solid fa-palette",
      },
      buttons: [
        {
          label: "TOKEN.FIELDS.texture.tint.label",
          action: "texture.tint",
          callback: (ev, button, dialog) => {
            return {
              fieldPath: button.dataset.action,
              color: button.form.color.value,
            };
          },
        },
        {
          label: "TOKEN.FIELDS.ring.colors.ring.label",
          action: "ring.colors.ring",
          callback: (ev, button, dialog) => {
            return {
              fieldPath: button.dataset.action,
              color: button.form.color.value,
            };
          },
        },
      ],
    });

    if (!fd) return;

    return this.updateTokens(fd.fieldPath, fd.color);
  }

  /* -------------------------------------------------- */

  /**
   * Update each member token.
   * @param {string} fieldPath  The token document field path to update.
   * @param {any} data          The data to update all tokens to.
   * @param {object} [options]  Additional operation options.
   * @returns {Promise<DrawSteelTokenDocument[][]>} An array of updated token arrays.
   */
  async updateTokens(fieldPath, data, options = {}) {
    // TODO: Implement v14 batch update operation
    const tokens = Array.from(this.members).map(c => c.token).filter(_ => _);
    const batchData = tokens.reduce((batch, t) => {
      batch[t.parent.id] ??= [];
      batch[t.parent.id].push({ _id: t.id, [fieldPath]: data });
      return batch;
    }, {});
    return Promise.all(
      Object.entries(batchData)
        .map(([sceneId, updateData]) => game.scenes.get(sceneId).updateEmbeddedDocuments("Token", updateData, options)),
    );
  }
}
