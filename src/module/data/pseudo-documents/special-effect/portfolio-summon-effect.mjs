import BaseSpecialEffect from "./base-special-effect.mjs";
import DSDialog from "../../../applications/api/dialog.mjs";
import { systemID } from "../../../constants.mjs";

/**
 * @import { DrawSteelActor, DrawSteelTokenDocument } from "../../../documents/_module.mjs"
 * @import ActorChoiceAdvancement from "../advancements/actor-choice-advancement.mjs";
 * @import { SummonPortfolio } from "../../actor/_types";
 */

const { createFormGroup, createSelectInput, createNumberInput } = foundry.applications.fields;

/**
 * A type of effect that summons from a fixed list of options.
 */
export default class PortfolioSummonSpecialEffect extends BaseSpecialEffect {
  /** @inheritdoc */
  static get TYPE() {
    return "portfolioSummon";
  }

  /* -------------------------------------------------- */

  /**
   * Places summons.
   * @returns {Promise<DrawSteelTokenDocument[] | null>} Returns null if the user did not have permissions.
   */
  async performSummon() {
    const hero = this.document.actor;
    if (hero.type !== "hero") {
      return void ui.notifications.error();
    }

    /** @type {SummonPortfolio[]} */
    const portfolio = hero.system._summonPortfolios[this.document.dsid];

    if (!portfolio) return void ui.notifications.error();

    // TODO: Sacrifice and other adjustments
    const currentHR = hero.system.hero.primary.value;

    const summonOptions = portfolio.reduce((options, o) => {
      const idx = fromUuidSync(o.uuid);
      if (idx && (o.cost <= currentHR)) options.push({ label: idx.name, value: idx.uuid });
      return options;
    }, []);

    if (!summonOptions.length) return void ui.notifications.error("DRAW_STEEL.Actor.Summoning.Errors.NO_OPTIONS", { localize: true });
    // Token permissions handled by placeActor

    const content = document.createElement("div");

    const uuidSelect = createFormGroup({
      label: "DRAW_STEEL.Actor.Summoning.ActorSelectDialog.uuid.label",
      hint: "DRAW_STEEL.Actor.Summoning.ActorSelectDialog.uuid.hint",
      input: createSelectInput({
        name: "uuid",
        options: summonOptions,
      }),
      localize: true,
    });

    const signatureCount = createFormGroup({
      label: "DRAW_STEEL.Actor.Summoning.ActorSelectDialog.count.label",
      hint: "DRAW_STEEL.Actor.Summoning.ActorSelectDialog.count.hint",
      input: createNumberInput({
        name: "count",
        min: 1,
        max: hero.system.hero.primary.value,
      }),
      localize: true,
    });

    content.append(uuidSelect, signatureCount);

    const fd = await DSDialog.input({
      content,
      window: {
        title: "DRAW_STEEL.Actor.Summoning.ActorSelectDialog.title",
        icon: "fa-solid fa-transporter-2",
      },
      render: (ev, dialog) => {
        /** @type {HTMLInputElement} */
        const signature = dialog.element.querySelector("[name=\"count\"]").closest(".form-group");
        dialog.element.querySelector("[name=\"uuid\"]").addEventListener("change", (e) => {
          signature.hidden = portfolio.find(o => o.uuid === e.target.value).cost !== null;
        });
      },
    });

    if (!fd) return null;

    let { cost, count } = portfolio.find(o => o.uuid === fd.uuid);

    // Signature minions have a null count & cost and instead just directly scale with the # summoned
    if (!cost) count = cost = fd.count;

    const tokens = await this.parent.performSummon(fd.uuid, { count });

    if (tokens?.length) {
      await hero.modifyTokenAttribute("hero.primary.value", -cost, true);
    }

    return tokens;
  }
}
