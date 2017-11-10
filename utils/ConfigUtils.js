const StorageUtils = require('./StorageUtils');
const LoggerUtils = require('./LoggerUtils');

function getConfigFile() {
  return new Promise((resolve, reject) => {
    StorageUtils.get(`config-${process.env.LOCALE}`).then(config => {
      LoggerUtils.log('GOT CONFIG FROM REDIS');
      resolve({
        data: config
      });
    }).catch(error => {
      LoggerUtils.error('FAILED TO GET CONFIG FROM REDIS', error);
      reject(error);
    });
  });
}

function getEnvConfigFile() {
  return new Promise((resolve, reject) => {
    StorageUtils.get(`config-env-${process.env.LOCALE}`).then(config => {
      LoggerUtils.log('GOT ENV CONFIG FROM REDIS');
      resolve({
        data: config
      });
    }).catch(error => {
      LoggerUtils.error('FAILED TO GET ENV CONFIG FROM REDIS', error);
      reject(error);
    });
  });
}

// GET NEW CONFIG FILE FROM API
function updateConfig(app) {
  if (process.env.CONFIG_ENV === 'local') {
    LoggerUtils.log('~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~');
    LoggerUtils.log('USING THE LOCAL CONFIG FILE');
    LoggerUtils.log('~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~');
    return new Promise((resolve, reject) => {
      const config = getStaticEnvConfig();
      StorageUtils.set(`config-${process.env.LOCALE}`, config)
        .then(resolve)
        .catch(reject);
    });
  }

  const Model = require('../../server/models/config')(app, app.get('config'));
  return Model.get({
    locale: process.env.LOCALE,
    country: process.env.COUNTRY
  }, 'config');
}

function updateEnvConfig(app) {
  const Model = require('../../server/models/config')(app, app.get('config'));
  return Model.get({
    locale: process.env.LOCALE,
    country: process.env.COUNTRY
  }, 'evconfig');
}

function getStaticEnvConfig() {
  const path          = require('path'),
    rootPath      = path.normalize(__dirname);

  return require(rootPath + `/../../_cache/config-${process.env.LOCALE}.json`);
}

module.exports = {
  getConfigFile,
  getEnvConfigFile,

  updateConfig,
  updateEnvConfig,

  getStaticEnvConfig
};
