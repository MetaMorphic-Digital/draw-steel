/**
 * A document subclass adding system-specific behavior and registered in CONFIG.JournalEntry.documentClass.
 */
export default class DrawSteelJournalEntryPage extends foundry.documents.JournalEntryPage {

  /**
   * Add Draw Steel specific prosemirror inserts. Called in the `setup` hook.
   */
  static addProseMirrorInserts() {

    const tierOutcome = {
      action: "ds.tierOutcome",
      title: "DRAW_STEEL.JournalEntryPage.INSERTS.tierOutcome",
      html: `
<dl class="power-roll-display">
  <dt class="tier1">
      <p>!</p>
  </dt>
  <dd>
      <p>Tier 1 Outcome HTML.</p>
  </dd>
  <dt class="tier2">
      <p>@</p>
  </dt>
  <dd>
      <p>Tier 2 Outcome HTML.</p>
  </dd>
  <dt class="tier3">
      <p>#</p>
  </dt>
  <dd>
      <p>Tier 3 Outcome HTML.</p>
  </dd>
</dl>`,
    };

    const hangingIndent = {
      action: "ds.hanging-indent",
      title: "DRAW_STEEL.JournalEntryPage.INSERTS.hangingIndent",
      html: "<p class=\"hanging-indent\"><selection></selection></p>",
    };

    const glyph = {
      action: "ds.glyph",
      title: "DRAW_STEEL.JournalEntryPage.INSERTS.glyph",
      html: "<span class=\"glyph\"><selection>x</selection></span>",
    };

    const boxed = {
      action: "ds.boxed",
      title: "DRAW_STEEL.JournalEntryPage.INSERTS.boxed",
      html: "<aside class=\"boxed\"><selection><p>Text Here</p></selection></aside>",
    };

    const inverseBox = {
      action: "ds.inverseBox",
      title: "DRAW_STEEL.JournalEntryPage.INSERTS.inverseBox",
      html: "<aside class=\"boxed\"><div class=\"inverse\"><selection><p>Text Here</p></selection></div></aside>",
    };

    const callout = {
      action: "ds.callout",
      title: "DRAW_STEEL.JournalEntryPage.INSERTS.callout",
      html: "<aside class=\"callout\"><img class=\"icon\" src=\"icons/vtt-512.png\"><selection><p>Text Here</p></selection></aside>",
    };

    const abilityBorder = {
      action: "ds.abilityBorder",
      title: "DRAW_STEEL.JournalEntryPage.INSERTS.abilityBorder",
      html: "<div class=\"ability-bordered\"><selection><h5>@UUID[Compendium.draw-steel.abilities.Item.wU69Y06G9lYFrvp6]</h5><p>@Embed[Compendium.draw-steel.abilities.Item.wU69Y06G9lYFrvp6 includeName=false]</p></selection></div>",
    };

    const abilityBorderQuick = {
      action: "ds.abilityBorderQuick",
      title: "DRAW_STEEL.JournalEntryPage.INSERTS.abilityBorderQuick",
      html: "<div class=\"ability-bordered quick\"><selection><h5>@UUID[Compendium.draw-steel.abilities.Item.wU69Y06G9lYFrvp6]</h5><p>@Embed[Compendium.draw-steel.abilities.Item.wU69Y06G9lYFrvp6 includeName=false]</p></selection></div>",
    };

    const malice = {
      action: "ds.malice",
      title: "DRAW_STEEL.JournalEntryPage.INSERTS.malice",
      html: "<aside class=\"malice\"><selection><p>@Embed[Compendium.draw-steel.monster-features.Item.GpKibCtEYzdsnGSX]</p></selection></aside>",
    };

    CONFIG.TextEditor.inserts.push({
      action: "draw-steel",
      title: "DRAW_STEEL.JournalEntryPage.INSERTS.title",
      children: [tierOutcome, hangingIndent, glyph, boxed, inverseBox, callout, abilityBorder, abilityBorderQuick, malice],
    });
  }

  /** @inheritdoc */
  toAnchor({ attrs = {}, dataset = {}, classes = [], name, icon } = {}) {
    if (typeof this.system.richTooltip === "function") {
      dataset.tooltipHtml = CONFIG.ux.TooltipManager.constructHTML({ uuid: this.uuid });
    }
    return super.toAnchor({ attrs, dataset, classes, name, icon });
  }
}
