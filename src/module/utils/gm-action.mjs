/** Shared helpers for GM-mediated chat actions. */
export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character])
  );
}

export function encodePayload(payload) {
  return btoa(encodeURIComponent(JSON.stringify(payload)));
}

export function decodePayload(encoded) {
  return JSON.parse(decodeURIComponent(atob(encoded)));
}

export function canUserModifyToken(token, user = game.user) {
  const OWNER = CONST.DOCUMENT_OWNERSHIP_LEVELS?.OWNER ?? 3;
  return token?.document?.testUserPermission?.(user, OWNER) ?? token?.document?.isOwner ?? false;
}

export function partitionTokensByOwnership(tokens, user = game.user) {
  const controllable = [];
  const restricted = [];

  for (const token of tokens) {
    if (!token?.document) continue;
    if (canUserModifyToken(token, user)) controllable.push(token);
    else restricted.push(token);
  }

  return { controllable, restricted };
}
