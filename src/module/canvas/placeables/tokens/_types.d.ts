import DrawSteelTokenDocument from "../../../documents/token.mjs";

type PrototypeToken = foundry.data.PrototypeToken;

/**
 * Configuration information for a token placement operation.
 */
interface TokenPlacementConfiguration {
  /** Token that is the origin point of the placement. */
  origin?: DrawSteelTokenDocument;
  /** Prototype token information for rendering. */
  tokens: PrototypeToken[];
}

/**
 * Data for token placement on the scene.
 */
interface TokenPlacementData {
  prototypeToken: PrototypeToken;
  index: {
    /** Index of the placement across all placements. */
    total: number;
    /** Index of the placement across placements with the same original token. */
    unique: number;
  };
  x: number;
  y: number;
  elevation: number;
  rotation: number;
}
