export default class DrawSteelSocketHandler {
  constructor() {
    this.identifier = "system.draw-steel";
    this.registerSocketHandlers();
  }

  /* -------------------------------------------------- */

  /**
   * Sets up socket reception
   */
  registerSocketHandlers() {
    game.socket.on(this.identifier, ({type, payload}) => {
      switch (type) {
        default:
          throw new Error("Unknown type");
      }
    });
  }

  /* -------------------------------------------------- */

  /**
   * Emits a socket message to all other connected clients
   * @param {string} type
   * @param {object} payload
   */
  emit(type, payload) {
    game.socket.emit(this.identifier, {type, payload});
  }
}
