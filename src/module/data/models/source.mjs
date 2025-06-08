import DocumentInput from "../../applications/api/document-input.mjs";

/** @import BasePackage from "@common/packages/base-package.mjs"; */
/** @import { DrawSteelActor, DrawSteelItem } from "../../documents/_module.mjs" */

const fields = foundry.data.fields;

/**
 * Data model
 */
export default class SourceModel extends foundry.abstract.DataModel {
  /** @inheritdoc */
  static defineSchema() {
    return {
      book: new fields.StringField({ required: true }),
      page: new fields.StringField({ required: true }),
      license: new fields.StringField({ required: true }),
      revision: new fields.NumberField({ initial: 1 }),
    };
  }

  /* -------------------------------------------- */

  /**
   * Check if the provided package has any source books registered in its manifest. If it has only one, then return
   * that book's key.
   * @param {BasePackage} pkg  The package.
   * @returns {string|null}
   */
  static getModuleBook(pkg) {
    if (!pkg) return null;
    const sourceBooks = foundry.utils.getProperty(pkg, "flags.draw-steel.sourceBooks");
    const keys = Object.keys(sourceBooks ?? {});
    if (keys.length !== 1) return null;
    return keys[0];
  }

  /* -------------------------------------------- */

  /**
   * Get the package associated with the given UUID, if any.
   * @param {string} uuid  The UUID.
   * @returns {BasePackage}
   */
  static getPackage(uuid) {
    const pack = foundry.utils.parseUuid(uuid)?.collection?.metadata;
    switch (pack?.packageType) {
      case "module": return game.modules.get(pack.packageName);
      case "system": return game.system;
      case "world": return game.world;
    }
    return null;
  }

  /**
   * Fetches the document containing this model
   * @returns {DrawSteelActor | DrawSteelItem}
   */
  get document() {
    return this.parent?.parent ?? null;
  }

  /**
   * Prepare the source label.
   * @param {string} uuid  Compendium source or document UUID.
   */
  prepareData(uuid) {
    const pkg = SourceModel.getPackage(uuid);
    this.bookPlaceholder ??= SourceModel.getModuleBook(pkg) ?? "";
    if (!this.book) this.book = this.bookPlaceholder;

    const page = Number.isNumeric(this.page)
      ? game.i18n.format("DRAW_STEEL.Source.Display.Page", { page: this.page }) : (this.page ?? "");
    this.label = game.i18n.format("DRAW_STEEL.Source.Display.Full", { book: this.book, page }).trim();

    this.value = this.book || (pkg?.title ?? "");
    this.slug = this.value.slugify({ strict: true });
  }

  /** @inheritdoc */
  toString() {
    return this.label;
  }

  /**
   * Render a DialogV2 instance to update the SourceModel.
   * If the document is an Item it also adds a field for _dsid
   * @returns {DrawSteelActor | DrawSteelItem}
   */
  async updateDialog() {
    const dialogContent = function () {
      const htmlContainer = document.createElement("div");
      for (const [key, field] of Object.entries(this.schema.fields)) {
        htmlContainer.append(field.toFormGroup({}, { value: this[key] }));
      }
      if (this.document?.documentName === "Item") {
        const field = this.parent.schema.getField("_dsid");
        htmlContainer.append(field.toFormGroup({}, { value: this.parent._dsid }));
      }

      return htmlContainer.innerHTML;
    };

    new DocumentInput({
      document: this.document,
      contentFunc: dialogContent.bind(this),
      classes: ["document-source"],
      window: {
        title: "DRAW_STEEL.Source.UpdateTitle",
        icon: "fa-solid fa-book",
      },
    }).render({ force: true });
  }
}
