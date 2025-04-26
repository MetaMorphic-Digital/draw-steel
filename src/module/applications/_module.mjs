export * as api from "./api/_module.mjs";
export * as apps from "./apps/_module.mjs";
export * as hooks from "./hooks/_module.mjs";
export * as sheets from "./sheets/_module.mjs";
export * as ui from "./ui/_module.mjs";
export * as sidebar from "./sidebar/_module.mjs";

import * as elements from "./elements/_module.mjs";

window.customElements.define("ds-checkbox", elements.CheckboxElement);
window.customElements.define("slide-toggle", elements.SlideToggleElement);

export { elements };
