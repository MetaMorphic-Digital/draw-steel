
/**
 * Data Model variant that does not export fields with an `undefined` value during `toObject(true)`.
 * Copied from dnd5e.
 */
export default class SparseDataModel extends foundry.abstract.DataModel {
  /** @inheritDoc */
  toObject(source = true) {
    if (!source) return super.toObject(source);
    const clone = foundry.utils.flattenObject(this._source);
    // Remove any undefined keys from the source data
    Object.keys(clone).filter(k => clone[k] === undefined).forEach(k => delete clone[k]);
    return foundry.utils.expandObject(clone);
  }
}
