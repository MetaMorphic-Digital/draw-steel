import DrawSteelActor from "../documents/actor.mjs";

/**
 * Provide external add-on Polyglot with default settings for all of Draw Steel's in-game languages. Polyglot LINK: https://foundryvtt.com/packages/polyglot/
 * The DrawSteelLanguageProvider class can be later accessed at `game.polyglot.api.providers[`system.${ds.CONST.systemID}`]`, after "polyglot.ready" Hook has fired.
 * 
 * This provider must be handed over to Polyglot during its initialization, or the module will fallback to the Generic language provider.
 * Most of the class is built around providing the `languages` field as soon as possible (for chat message masking?) during world load, and
 * then later fleshing that field out with localized labels and module config states.
 * @param {LanguageProvider} LanguageProvider - Base languages configuration class provided by the Polyglot init event.
 */
export function polyglotInit(LanguageProvider) {
  class DrawSteelLanguageProvider extends LanguageProvider {

    requiresReady = true; // Ask Polyglot to wait to load until "ready" has fired/babele is done loading.

    /**
     * Polyglot-compatible list of all languages in Draw Steel, with their default configurations.
     * Called during init, before localization is ready. Polyglot unconditionally requires the language-to-font relationship be available at this stage, though,
     * or it will fallback to Generic language provider. `rng` and `label` are fully fleshed out as part of setup later.
     * @typedef {Object}
     * @property {string} label - The displayed name for the language, used in the UI.
     * @property {string} font - The typeface name used to render language'd text in the UI. This is the full, well-formatted text of the Polyglot font selection dropdown list, spaces and all.
     * Don't assume access to core Foundry fonts! Polyglot module setting to allow Foundry fonts is off by default.
     * @property {string} rng - Enum-like. The text scrambling logic of the language'd text.
     * "default" (consistent scrambling algo based on input string) / "unique" (identical text will not be identically scrambled) / "none" (use actual text with the wingding-like font; readable if a "real" font is used).
     */
    languages = {
      // ancestry languages
      caelian: { // Polyglot would like the first language provided to be the system's "Common" language
        font: "Meroitic Demotic",
      },
      anjali: {
        font: "High Drowic",
      },
      axiomatic: {
        font: "Miroslav Normal",
      },
      filliaric: {
        font: "Kargi",
      },
      highKuric: {
        font: "Maras Eye",
      },
      hyrallic: {
        font: "Ar Ciela",
      },
      illyvric: {
        font: "Ar Ciela",
      },
      kalliak: {
        font: "Kargi",
      },
      kethaic: {
        font: "Semphari",
      },
      khelt: {
        font: "Barazhad",
      },
      khoursirian: {
        font: "Meroitic Demotic",
      },
      lowKuric: {
        font: "Ork Glyphs",
      },
      mindspeech: {
        font: "Saurian",
      },
      protoCtholl: {
        font: "Tengwar",
      },
      szetch: {
        font: "Kargi",
      },
      theFirstLanguage: {
        font: "Mage Script",
      },
      tholl: {
        font: "Tengwar",
      },
      urollialic: {
        font: "Skaven",
      },
      variac: {
        font: "Skaven",
      },
      vastariax: {
        font: "Rellanic",
      },
      vhoric: {
        font: "Maras Eye",
      },
      voll: {
        font: "Celestial",
      },
      yllyric: {
        font: "Ar Ciela",
      },
      zahariax: {
        font: "Dark Eldar",
      },
      zaliac: {
        font: "Floki",
      },
      // Human languages. Khoursirian already covered
      higaran: {
        font: "Meroitic Demotic",
      },
      khemharic: {
        font: "Meroitic Demotic",
      },
      oaxuatl: {
        font: "Meroitic Demotic",
      },
      phaedran: {
        font: "Meroitic Demotic",
      },
      riojan: {
        font: "Meroitic Demotic",
      },
      uvalic: {
        font: "Meroitic Demotic",
      },
      vaniric: {
        font: "Meroitic Demotic",
      },
      vasloria: {
        font: "Meroitic Demotic",
      },
      // Dead languages
      highRhyvian: {
        font: "Ar Ciela",
      },
      khamish: {
        font: "Jungle Slang",
      },
      kheltivari: {
        font: "Barazhad",
      },
      lowRhivian: {
        font: "Ar Ciela",
      },
      oldVariac: {
        font: "Skaven",
      },
      phorialtic: {
        font: "Ork Glyphs",
      },
      rallarian: {
        font: "Floki",
      },
      ullorvic: {
        font: "Ar Ciela",
      },
    };

    /**
     * Fleshes out the `languages` property on this class to Polyglot for use.
     * It must be fully fleshed out at this stage, with the necessary `label` and `rng` properties.
     * Called by base class as part of super.setup().
     * 
     * REVIEW: Polyglot allows Directors to add and configure homebrew, custom languages.
     *         We could allow Polyglot to insert those custom languages to ds.CONFIG.languages, so that custom languages appear as advancement options.
     *         If this is something we want, and are able to do without breaking other setups, then this is probably the place to do it.
     */
    async getLanguages() {
      const outputLangs = {};

      if (this.replaceLanguages) { // if module setting to only use custom-set languages is enabled
        this.languages = {}; // remove the rpg system's own list of languages from Polyglot. (No impact to PC feature selection options.)
      }
      const languagesSetting = game.settings.get("polyglot", "Languages"); // User-set fonts and scrambling overrides for system langs
      for (let lang in this.languages) {
        outputLangs[lang] = {
          label: ds.CONFIG.languages[lang].label,
          font: languagesSetting[lang]?.font || this.languages[lang]?.font || this.defaultFont,
          rng: languagesSetting[lang]?.rng ?? "default",
        };
      }
      this.languages = outputLangs;
    }

    /**
     * Returns Draw Steel language keys for a specific actor document, as translated into a Polyglot-compatible object.
     * Called during init on user's designated character, before lang list is fully loaded, to establish user's chat language options. 
     * Called also by Director during regular play, whenever selecting an actor on the canvas.
     * @param {DrawSteelActor} actor
     * @returns [known_languages, literate_languages] Array of Set objects for spoken, written language keys for the actor.
     */
    getUserLanguages(actor) {
      let known_languages = new Set(); // set of language keys; fluency with spoken language
      let literate_languages = new Set(); // set of language keys; fluency with written language.

      const actorLangs = Array.from(actor.system.biography?.languages);

      if (actorLangs) {
        known_languages = new Set(actorLangs);
      }
      
      return [known_languages, literate_languages];
      // REVIEW: We could mark Dead Languages as written-only with `literate_languages` here. Polyglot would limit these languages to Journals.
      //         But Heroes p57 immediately gives an exception to Dead Langauges being written-only, with Khamish described as still having a spoken niche.
      //         Is it desirable behavior to limit some/all Dead Languages to Journals?
    }

  } // end DrawSteelLanguageProvider

  // Final handover of system's language provider to Polyglot.
  game.polyglot.api.registerSystem(DrawSteelLanguageProvider); 

  // Force the language list to be prepped. This is for when, on world startup, Draw Steel is not currently the default language provider.
  // Only necessary to prevent Polyglot settings from going unresponsive when switching _to_ Draw Steel language provider.
  // FIXME: This manual invoking of language setup doesn't seem to appear in other systems' language providers...
  //        There's probably a better approach to preventing this unresponsiveness.
  Hooks.once("ds.ready", async () => {
    const providerId = `system.${ds.CONST.systemID}`;
    if (game.polyglot.api.languageProvider.id != providerId) {
      game.polyglot.api.providers[providerId].getLanguages();
    }
  });
} // end polyglotInit()
