'use strict';
const _               = require('lodash'),
  LoggerUtils     = require('./LoggerUtils'),
  ContentUtils     = require('./ContentUtils'),
  StorageUtils     = require('./StorageUtils'),
  getAssetsFile = function() {
    LoggerUtils.log('GET ASSETS FILE');
    return new Promise((resolve, reject) => {
      StorageUtils.get(`assets-${process.env.LOCALE}`).then((assets) => {
        resolve({
          data: assets
        });
      })
      .catch(() => {
        LoggerUtils.log('FAILED TO GET THE OBJECT FROM CACHE');
        reject();
      });
    });
  },
  updateAssetMap = function(data, node) {
    return new Promise((resolve, reject) => {
      LoggerUtils.log('UPDATING ASSET MAP FOR::', node);
      let assetsClone = {};

      getAssetsFile().then((response) => {
        assetsClone = _.cloneDeep(response.data) || {};
        assetsClone[node] = data;
        StorageUtils.set(`assets-${process.env.LOCALE}`, assetsClone).then(resolve).catch(reject);
      }).catch((error) => {
        LoggerUtils.error('NO DATA IN CACHE::', error);
        assetsClone[node] = data;
        LoggerUtils.log('CREATING NEW DATA FOR:', node);
        StorageUtils.set(`assets-${process.env.LOCALE}`, assetsClone).then(resolve).catch(reject);
      });
    });
  },
  updateImages = function() {
    return new Promise((resolve, reject) => {
      const contentType = 'imageAsset',
        lang = process.env.LOCALE,
        country = process.env.COUNTRY,
        component = 'web',
        contentUrl = `content_type=${contentType}&fields.languageId=${lang}&fields.country=${country}&fields.platform=${component}`;

      ContentUtils.makeContentRequest(contentUrl, 'system').then((response) => {
        const assets = _.get(response, 'data.includes.Asset'),
          assetMap = {};
        // Create images asset map
        _.each(assets, function(asset) {
          assetMap[asset.fields.title] = 'https:' + asset.fields.file.url;
        });
        updateAssetMap(assetMap, 'images')
        .then(resolve)
        .catch(reject);
      });
    });
  },
  updateText = function() {
    return new Promise((resolve, reject) => {
      const contentType = 'paragraphContentWrapper',
        lang = process.env.LOCALE,
        country = process.env.COUNTRY,
        contentUrl = `content_type=${contentType}&fields.languageId=${lang}&fields.country=${country}`;

      ContentUtils.makeContentRequest(contentUrl, 'managed').then((response) => {
        const paraContent = _.get(response, 'data.includes.Entry'),
          assetMap = {};
        // Create images asset map
        _.each(paraContent, function(para) {
          assetMap[para.fields.contentId] = para.fields;
        });
        updateAssetMap(assetMap, 'text')
        .then(resolve)
        .catch(reject);
      });
    });
  },
  updateLegal = function() {
    return new Promise((resolve, reject) => {
      const contentType = 'legalContentWrapper',
        lang = process.env.LOCALE,
        country = process.env.COUNTRY,
        contentUrl = `content_type=${contentType}&fields.languageId=${lang}&fields.country=${country}`;

      ContentUtils.makeContentRequest(contentUrl, 'managed').then((response) => {
        const legalIds = [],
          legalFields = _.get(response, 'data.items[0].fields.legalStatements'),
          legalContent = _.get(response, 'data.includes.Entry'),
          legalMap = _.keyBy(legalContent, (legalStatement) => {
            return legalStatement.sys.id;
          }),
          sortedLegalContent = _.sortBy(legalMap, (legalKeys) => {
            return _.indexOf(legalIds, legalKeys.sys.id);
          });

        _.forEach(legalFields, (legalId) => {
          legalIds.push(legalId.sys.id);
        });

        // Add the Privacy Version
        legalMap.privacyVersion = _.get(response, 'data.items[0].fields.acceptanceVersion');

        // Add the Raw array to be used for the pages
        legalMap.legalItems = sortedLegalContent;
        updateAssetMap(legalMap, 'legal')
        .then(resolve)
        .catch(reject);
      }).catch(reject);
    });
  },

  refreshAssets = function() {
    return Promise.all([
      updateLegal(),
      updateImages(),
      updateText()
    ]);
  };

module.exports = {
  // Also needed outside this file
  getAssetsFile,

  updateImages,
  updateText,
  updateLegal,

  refreshAssets
};
