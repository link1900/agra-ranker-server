var inviteController = module.exports = {};

var _ = require('lodash');
var q = require('q');
var mongoose = require('mongoose');
var Invite = require('./invite').model;
var mongoService = require('../mongoService');
var helper = require('../helper');
var userService = require('./../user/userService');
var validator = require('validator');
var cleaner = require('validator');
var notificationService = require('../notification/notificationService');
var uuid = require('node-uuid');
var moment = require('moment');

inviteController.setModel = function(req, res, next, id) {
    Invite.findById(id, function(err, invite) {
        if (err) return next(err);
        if (!invite) return next(new Error('Failed to load ' + id));
        req.model = invite;
        return next();
    });
};

inviteController.prepareQuery = function(req, res, next) {
    req.searchQuery = {};
    var like = req.param('like');
    var email = req.param('email');
    if (like){
        req.searchQuery = {'email': {'$regex': email}};
    }
    if (email){
        req.searchQuery = {'email': email};
    }
    req.dao = Invite;
    next();
};

inviteController.createInvite = function(req, res){
    var invite = new Invite(req.body);
    invite.token =  uuid.v4();
    invite.expiry = moment().add(1,'months').toDate();
    var result = inviteController.clean(invite)
        .then(inviteController.validate)
        .then(inviteController.checkIsNotUser)
        .then(mongoService.savePromise)
        .then(inviteController.sendInviteEmail);

    helper.responseFromPromise(res, result);
};

inviteController.destroy = function(req, res) {
    helper.responseFromPromise(res, mongoService.removePromise(req.model));
};

inviteController.destroyExpired = function(req, res) {
    helper.responseFromPromise(res, mongoService.removeAll(Invite, {"expiry" : {$lte : new Date()}}));
};

inviteController.clean = function(invite){
    if (invite.email){
        invite.email = cleaner.normalizeEmail(invite.email);
    }
    return q(invite);
};

inviteController.validate = function(invite){
    if (validator.isNull(invite.email) || !validator.isEmail(invite.email)){
        return q.reject("must provide a valid email");
    }
    return q(invite);
};

inviteController.checkIsNotUser = function(invite){
    return userService.findUserByEmail(invite.email).then(function(foundUser){
        if (foundUser != null){
            return q.reject("email is already used");
        } else {
            return q(invite);
        }
    });
};

inviteController.sendInviteEmail = function(invite){
    var email = {subs:{}};
    email.to = invite.email;
    email.template = "invite";
    email.subject = "Invitation to join {{siteName}}";
    email.subs.inviteLink = notificationService.siteUrl + "/#/signup/" + invite.token;
    return notificationService.sendEmail(email).then(function(){
        return invite;
    });
};