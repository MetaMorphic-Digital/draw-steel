export interface GainResource {
  /** The full i18n path used to label the resource. */
  label: string;
  /** The full path, relative to the actor, used to update the resource. */
  resource: string;
  /** Final key in the i18n path used for localization, relative to DRAW_STEEL.EDITOR.Enrichers.Gain.{MessageTitle|FormatString} (default: "Default"). */
  resourceFormatString: string;
}

export interface SummonConfig {
  /** UUID for the actor doing the summoning. */
  summoner: string;
  /** ID for the item that may be called upon to perform the summoning. */
  summonItem: string;
  /** Roll formula for actors to summon. */
  count: string;
  /** UUID for the document providing the enricher. */
  origin: string;
}

export interface DirectSummonConfig extends SummonConfig {
  type: "direct";
  /** UUID for the actor being summoned. */
  actor: string;
}

export interface PortfolioSummonConfig extends SummonConfig {
  type: "portfolio";
  /** DSID of the portfolio to use. */
  portfolio: string;
  /** Only show signature minions and don't display cost. */
  signatureOnly: boolean;
}

export type AnySummonConfig = DirectSummonConfig | PortfolioSummonConfig;
