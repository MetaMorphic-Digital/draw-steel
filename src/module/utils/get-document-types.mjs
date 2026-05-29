/**
 * Get allowed document subtypes.
 * @param {string} documentName
 * @returns {Set<string>}
 */
export default function getDocumentTypes(documentName) {
  const Cls = getDocumentClass(documentName);
  if (!Cls.hasTypeData) throw new Error(`The '${documentName}' document class does not support subtypes.`);
  const { baseTypeAllowed = false } = Cls.metadata;
  const types = new Set(Cls.TYPES);
  if (!baseTypeAllowed) types.delete(CONST.BASE_DOCUMENT_TYPE);
  return types;
}
