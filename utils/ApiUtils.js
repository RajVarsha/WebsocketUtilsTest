'use strict';
const LoggerUtils = require('./LoggerUtils'),
  _ = require('lodash');

module.exports = {

  makeApiRequest: function(app, options, accessToken, refreshToken) {
    // UTILS
    const TokenUtils = require('./TokenUtils'),
      config = app.get('config'),
      request = require('request');

    return new Promise((resolve, reject) => {
      TokenUtils.requestNewAccessToken(app, accessToken, refreshToken)
      .then(token => {
        const headers = {
            'X-API-Key': config.api.key,
            'AppID': config.api.id,
            'AppVersion': config.api.version,
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json',
            'Requestor': 'VCClient'
          },
          requestParams = {
            url: options.url || '/',
            time: true,
            headers,
            method: options.method,
            body: JSON.stringify(Object.assign({}, options.data, {json: true}))
          };

        LoggerUtils.silly('MAKING API CALL');
        LoggerUtils.silly(requestParams);

        request(requestParams, (error, response, body) => {
          let data = '';
          if (!error &&
            (response.statusCode === 200 ||
            response.statusCode === 201 ||
            response.statusCode === 202)) {
            try {
              data = JSON.parse(body);
            } catch (e) {
              reject({
                data: data,
                responseTime: (_.get(response, 'elapsedTime') / 1000),
                code: e,
                title: 'Error!',
                message: config.errorCodes[e]
              });
            }

            resolve({
              data: data.payload,
              responseTime: (_.get(response, 'elapsedTime') / 1000),
              status: {
                code: response.statusCode,
                message: 'Success'
              }
            });
          } else {
            let code = _.get(response, 'statusCode');

            if (_.get(data, 'vcerrorCode.code')) {
              code = data.vcerrorCode.code;
            }

            if (error) {
              reject({
                data: data,
                responseTime: (_.get(response, 'elapsedTime') / 1000),
                code: code,
                title: 'Error!',
                message: config.errorCodes[code]
              });
            } else {
              reject({
                data: data,
                responseTime: (_.get(response, 'elapsedTime') / 1000),
                code: code,
                title: 'Error!',
                message: body
              });
            }
          }
        });
      })
      .catch((error) => {
        LoggerUtils.log('ERROR GETTING A TOKEN', error);
        reject(error);
      });
    });
  }
};
