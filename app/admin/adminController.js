const adminController = module.exports = {};

const adminService = require('./adminService');
const helper = require('../helper');

adminController.setCollectionName = function (req, res, next, collectionName) {
    req.collectionName = collectionName;
    next();
};

adminController.dropCollection = function (req, res) {
    switch (req.collectionName) {
        case 'greyhound' :
            helper.responseFromPromise(res, adminService.removeAllGreyhounds());
            break;
        case 'race' :
            helper.responseFromPromise(res, adminService.removeAllRaces());
            break;
        case 'rankingSystem' :
            helper.responseFromPromise(res, adminService.removeAllRankingSystems());
            break;
        case 'ranking' :
            helper.responseFromPromise(res, adminService.removeAllRankings());
            break;
        default:
            res.jsonp(404, { error: 'collection not found' });
            break;
    }
};

adminController.setupCollection = function (req, res) {
    switch (req.collectionName) {
        case 'rankingSystem' :
            helper.responseFromPromise(res, adminService.setupRankingSystemDefaults());
            break;
        default:
            res.jsonp(404, { error: 'collection not found' });
            break;
    }
};

adminController.getCounts = function (req, res) {
    helper.responseFromPromise(res, adminService.getAllCounts());
};
