/**
 * Convenience method to get the unique actors of controlled tokens.
 * @returns {Set<Actor>}    The set of actors of the controlled tokens.
 */
export default function selectedActors() {
  const tokens = canvas?.tokens?.controlled ?? [];
  const actors = tokens.map(token => token.actor).filter(_ => _);
  return new Set(actors);
}
