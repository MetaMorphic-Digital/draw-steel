/**
 * A document subclass adding system-specific behavior and registered in CONFIG.JournalEntry.documentClass.
 */
export default class DrawSteelJournalEntryPage extends foundry.documents.JournalEntryPage {
  /** @inheritdoc */
  toAnchor({ attrs = {}, dataset = {}, classes = [], name, icon } = {}) {
    if (typeof this.system.richTooltip === "function") {
      dataset.tooltipHtml = CONFIG.ux.TooltipManager.constructHTML({ uuid: this.uuid });
    }
    return super.toAnchor({ attrs, dataset, classes, name, icon });
  }
}
