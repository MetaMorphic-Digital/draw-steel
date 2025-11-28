/**
 * Register all handlebars in Draw Steel.
 */
export function registerHandlebars() {
  Handlebars.registerHelper({
    "ds-tooltip": CONFIG.ux.TooltipManager.handlebarsHelper,
  });
}
