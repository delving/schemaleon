'use strict';

module.exports = ID;

function ID(storage) {
    this.storage = storage;
}

var P = ID.prototype;

function generateId(prefix) {
    var millisSince2013 = new Date().getTime() - new Date(2013, 1, 1).getTime();
    var randomNumber = Math.floor(Math.random() * 36 * 36 * 36);
    var randomString = randomNumber.toString(36);
    while (randomString.length < 3) {
        randomString = '0' + randomString;
    }
    return 'OSCR-' + prefix + '-' + millisSince2013.toString(36) + '-' + randomString;
}

P.generateUserId = function () {
    return generateId('US');
};

P.generateGroupId = function () {
    return generateId('GR');
};

P.generateDocumentId = function (schemaName) {
    return generateId(schemaName);
};

P.generateImageId = function () {
    return generateId('IM');
};

P.generateVocabId = function () {
    return generateId('VO');
};

P.generateCollectionId = function () {
    return generateId('CO');
};