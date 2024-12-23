/**
 * A hook event that fires when the ActiveEffectConfig application is rendered
 * @param {ActiveEffectConfig} app
 * @param {JQuery<HTMLElement>} jquery
 * @param {Record<string, any>} context
 */
export function renderActiveEffectConfig(app, [html], context) {
  /**
   * @type {import("../../documents/active-effect.mjs").DrawSteelActiveEffect}
   */
  const effect = app.document;

  if (effect.type !== "base") return;

  const endOptions = Object.entries(ds.CONFIG.effectEnds).map(([value, {label}]) => ({value, label}));

  const endsInput = effect.system.schema.getField("end.type").toFormGroup(
    {},
    {options: endOptions, value: effect.system.end.type, blank: ""}
  );

  const rollInput = effect.system.schema.getField("end.roll").toFormGroup({}, {value: effect.system.end.roll});

  const hrBreak = document.createElement("hr");

  const durationTab = html.querySelector([".tab[data-tab=\"duration\"]"]);

  durationTab.prepend(endsInput, rollInput, hrBreak);

  app.setPosition();
}
