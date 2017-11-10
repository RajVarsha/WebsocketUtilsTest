'use strict';

module.exports = {

  /**
   * This is a common utility to initialize all APIs and to handle
   * the socket communication as well as the user being logged in
   * @param {any} socket the entire socket object
   * @param {any} id the API id to listen to in the socket layer
   * @param {any} modelMethod the Model Method to be called that should return a Promise
   */
  initialize: function(socket, id, model, methodName) {
    socket.on(id, (data) => {    
      // (data) is a callback to socket.on
      if (socket.request.user.logged_in) {
        model[methodName](socket.request.user, data)
          .then((response) => {
            socket.emit(id, {
              success: response.success,
              data: response.data,
              responseTime: response.responseTime,
              status: {
                code: response.status && response.status.code || 200
              }
            });
          }).catch((error) => {
            // Set up the error handler block
            socket.emit(id, {
              data: error,
              responseTime: error.responseTime,
              status: {
                code: error.status && error.status.code || 500
              }
            });
          }); // END OF model
      } else {
        socket.emit(id, {
          data: false,
          responseTime: 0,
          status: {
            code: 403,
            message: 'Unauthorized'
          }
        });
      }
    });
  }
};
