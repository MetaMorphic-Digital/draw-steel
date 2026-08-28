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

    /** @type {SummonPortfolio[]} */
    const portfolio = hero.system._summonPortfolios[this.document.dsid] ?? [];

    const summonOptions = portfolio.reduce((options, o) => {
      const idx = fromUuidSync(o.uuid);
      if (idx) options.push({
        label: _loc("DRAW_STEEL.Actor.Summoning.ActorSelectDialog.optionLabel", {
          name: idx.name,
          cost: o.cost ?? _loc("DRAW_STEEL.Actor.Summoning.ActorSelectDialog.signature"),
        }),
        value: idx.uuid,
      });
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
        value: 1,
      }),
      localize: true,
    });

    const resourceCost = createFormGroup({
      label: "DRAW_STEEL.Actor.Summoning.ActorSelectDialog.cost.label",
      hint: "DRAW_STEEL.Actor.Summoning.ActorSelectDialog.cost.hint",
      input: createNumberInput({
        name: "cost",
        min: 1,
        max: hero.system.hero.primary.value,
        value: portfolio[0].cost ?? 1,
      }),
      localize: true,
    });

    content.append(uuidSelect, signatureCount, resourceCost);

    const fd = await DSDialog.input({
      content,
      window: {
        title: "DRAW_STEEL.Actor.Summoning.ActorSelectDialog.title",
        icon: "fa-solid fa-transporter-2",
      },
      render: (ev, dialog) => {
        /** @type {HTMLInputElement} */
        const costInput = dialog.element.querySelector("[name=\"cost\"]");
        /** @type {HTMLInputElement} */
        const signatureInput = dialog.element.querySelector("[name=\"count\"]");
        signatureInput.addEventListener("change", (e) => {
          costInput.value = e.target.value;
        });
        /** @type {HTMLDivElement} */
        const signatureGroup = signatureInput.closest(".form-group");
        dialog.element.querySelector("[name=\"uuid\"]").addEventListener("change", (e) => {
          const { cost } = portfolio.find(o => o.uuid === e.target.value);
          signatureGroup.hidden = cost !== null;
          costInput.value = cost ?? signatureInput.value;
        });
      },
    });

    if (!fd) return null;

    const summonInfo = portfolio.find(o => o.uuid === fd.uuid);

    const cost = fd.cost;

    // Signature minions have a null count & cost and instead just directly scale with the # summoned
    const count = summonInfo.count ?? fd.count;

    const tokens = await this.parent.performSummon(fd.uuid, { count });

    if (tokens?.length) {
      await hero.modifyTokenAttribute("hero.primary.value", -cost, true);
    }

    return tokens;
  }
}
