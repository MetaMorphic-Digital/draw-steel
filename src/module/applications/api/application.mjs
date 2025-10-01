const { HandlebarsApplicationMixin, Application } = foundry.applications.api;

/**
 * A stock form application meant for async behavior using templates.
 * @abstract
 */
export default class DSApplication extends HandlebarsApplicationMixin(Application) {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["draw-steel"],
    form: {
      handler: DSApplication.#submitHandler,
      closeOnSubmit: true,
    },
    position: {
      width: 450,
      height: "auto",
    },
    timeout: null,
    tag: "form",
    window: {
      contentClasses: ["standard-form"],
    },
  };

  /* -------------------------------------------------- */

  /**
   * Stored form data.
   * @type {object|null}
   */
  #config = null;

  /* -------------------------------------------------- */

  /**
   * Stored form data.
   * @type {object|null}
   */
  get config() {
    return this.#config;
  }

  /* -------------------------------------------------- */

  /**
   * Factory method for asynchronous behavior.
   * @param {object} options            Application rendering options.
   * @returns {Promise<object|null>}    A promise that resolves to the form data, or `null`
   *                                    if the application was closed without submitting.
   */
  static async create(options) {
    const { promise, resolve } = Promise.withResolvers();
    const application = new this(options);
    application.addEventListener("close", () => resolve(application.config), { once: true });
    application.render({ force: true });
    return promise;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onFirstRender(context, options) {
    const timeout = this.options.timeout;

    if (timeout) setTimeout(() => {
      ui.notifications.error("DRAW_STEEL.SOCKET.WARNING.Timeout", {
        format: {
          label: this.constructor.name,
          seconds: timeout / 1000,
        },
      });
      this.close();
    }, timeout);

    await super._onFirstRender(context, options);
  }

  /* -------------------------------------------------- */

  /**
   * Handle form submission. The basic usage of this function is to set `#config`
   * when the form is valid and submitted, thus returning `config: null` when
   * cancelled, or non-`null` when successfully submitted. The `#config` property
   * should not be used to store data across re-renders of this application.
   * @this {DSApplication}
   * @param {SubmitEvent} event           The submit event.
   * @param {HTMLFormElement} form        The form element.
   * @param {FormDataExtended} formData   The form data.
   * @param {object} [submitOptions]      Additional info potentially forwarded by {@link Application#submit}.
   */
  static #submitHandler(event, form, formData, submitOptions = {}) {
    this.#config = this._processFormData(event, form, formData, submitOptions);
  }

  /* -------------------------------------------------- */

  /**
   * Perform processing of the submitted data. To prevent submission, throw an error.
   * @param {SubmitEvent} event           The submit event.
   * @param {HTMLFormElement} form        The form element.
   * @param {FormDataExtended} formData   The form data.
   * @param {object} submitOptions        Additional info potentially forwarded by {@link Application#submit}.
   * @returns {object}                    The data to return from this application.
   */
  _processFormData(event, form, formData, submitOptions) {
    return foundry.utils.expandObject(formData.object);
  }
}
