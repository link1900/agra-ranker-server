var adminController = module.exports = {};

var q = require('q');
var adminService = require('./adminService');
var helper = require('../helper');

adminController.setCollectionName = function(req, res, next, collectionName){
    req.collectionName = collectionName;
    next();
};

adminController.dropCollection = function(req, res){
    switch(req.collectionName){
        case 'greyhound' :
            helper.responseFromPromise(res, adminService.removeAllGreyhounds());
        break;
        case 'batch' :
            helper.responseFromPromise(res, adminService.removeAllBatchJobs());
            break;
        case 'file' :
            helper.responseFromPromise(res, adminService.removeAllFiles());
            break;
        default:
            res.jsonp(404, {"error":"collection not found"});
        break;
    }
};

adminController.getCounts = function(req, res){
    helper.responseFromPromise(res, adminService.getAllCounts());
};