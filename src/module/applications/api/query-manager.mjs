const { HandlebarsApplicationMixin, Application } = foundry.applications.api;

/**
 * A stock class for delegating query actions.
 * @template QueryResult The expected result for the query manager.
 * @abstract
 */
export default class QueryManager extends HandlebarsApplicationMixin(Application) {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["draw-steel", "query-manager"],
    users: null,
    position: {
      width: 300,
      height: "auto",
    },
  };

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
    application.addEventListener("close", () => resolve(application.queryResult), { once: true });
    application.render({ force: true });
    return promise;
  }

  /* -------------------------------------------------- */

  /**
   * Convenient reference to the list of users who might roll the effect.
   * @type {DrawSteelUser[]}
   */
  get users() {
    return this.options.users;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _prepareContext(options) {
    return {
      users: this.users.reduce((obj, u) => {
        obj[u.id] = {
          user: u,
          query: this.queryResult[u.id],
        };
        return obj;
      }, {}),
    };
  }

  /* -------------------------------------------------- */

  /**
   * A record of query results by userId.
   * @type {Record<string, QueryResult>}
   */
  queryResult = {};
}
