///<reference path='../DefinitelyTyped/node/node.d.ts'/>
var childProcess = require('child_process');
var lang = require('./lang');
var model_user = require('../model/user');
var db = require('../db/db');
var util_auth = require('../util/auth');
var CONFIG = require('config');

var setAnalyticsStatus = function (params) {
    if (CONFIG.analytics && CONFIG.analytics.Analytics_UA && CONFIG.analytics.Analytics_Domain) {
        params.Analytics_UA = CONFIG.analytics.Analytics_UA;
        params.Analytics_Domain = CONFIG.analytics.Analytics_Domain;
    }
};

var getBasicParam = function (req, res) {
    var params = { basepath: CONFIG.assurenote.basepath, title: 'AssureNote', lang: lang.lang.en, UserName: null };
    var auth = new util_auth.Auth(req, res);

    if (!auth.isLogin()) {
        auth.clear();
        auth.set('guest', 'Guest');
    }
    params.UserName = auth.getLoginName();
    params.RecURL = CONFIG.rec.URL;
    setAnalyticsStatus(params);

    if (!CONFIG.compress_js) {
        params.isDevelopment = true;
    }
    return params;
};

exports.index = function (req, res) {
    var params = getBasicParam(req, res);
    res.render('index', params);
};
