/**
 * Created by trump on 15/12/19.
 */
/** @module requestHelper */
"use strict";

import $ from "jquery";
import _ from "lodash";
import EventEmitter from "./EventEmitter";
const requestEvents = new EventEmitter();

/**
 * Please override this config if you need
 * */
export const requestOptions = {
    token: (window.sessionStorage ? window.sessionStorage.token : null) || null,
    timeout: 1000 * 30,
    version: window.APP_VERSION,
    remoteServerBase: '',
    getResError: res => res.error
};

export function beforeRequest(fn) {
    return registerEvent('beforeRequest', fn);
}

export function onRequest(fn) {
    return registerEvent('onRequest', fn)
}

export function onRequestError(fn) {
    return registerEvent('onRequestError', fn);
}

function registerEvent(eventName, fn) {
    return requestEvents.on(eventName, fn);
}

/**
 * @param {String|urlQuery} url
 * @param {function(error: Object, res: Object)} callback
 * @param { {$$requestOptions:Object} } data
 * @param {String} type [get, post, delete, put]
 * */
export function request(url, callback, data = {}, type = 'get', dataType = 'json') {
    
    if (url instanceof urlQuery) {
        url = url.toString();
    }
    
    let startTime = Date.now();
    let getRequestTimeInfo = () => {
        let endTime = Date.now();
        return {
            startTime,
            endTime,
            totalTime: endTime - startTime
        }
    };
    
    var $$requestOptions = data.$$requestOptions;
    
    if ($$requestOptions) {
        delete  data.$$requestOptions;
    }
    
    var reqOptions = $.extend(true, {}, requestOptions, $$requestOptions);
    
    url = urlQuery(url).param({v: reqOptions.version}).getUrl();
    
    callback = wrapJqCallback(url, callback);
    
    var req = {
        type: type
        , data: JSON.stringify(data)
        , dataType
        , contentType: 'application/json; charset=utf-8'
        , cache: false
        , timeout: reqOptions.timeout !== undefined ? request.timeout : undefined
        , headers: {
            "X-App-Token": reqOptions.token
        }
        , ...reqOptions
    };
    
    requestEvents.emit('beforeRequest', {
        url, req
    });
    
    return doRequest(url, req);
    
    function doRequest(url, req) {
        if (url.indexOf('http') < 0) {
            url = getRemotePath(url);
        }
        
        return $.ajax(url, req).done(callback.success).fail(callback.error)
    }
    
    function wrapJqCallback(url, callback) {
        return {
            success: function (res) {
                setToken(res && res.token);
                requestEvents.emit('onRequest', {url, req, res, ...getRequestTimeInfo()});
                callback(reqOptions.getResError(res), res);
            }
            , error: function (deffer, errType, message) {
                const {responseJSON, status} = deffer;
                
                if (status !== 401) {
                    console.error(url, arguments);
                }
                
                requestEvents.emit('onRequestError', {
                    url,
                    req,
                    status,
                    ...getRequestTimeInfo(),
                    deffer,
                    responseJSON,
                    errType,
                    message
                });
                
                return callback(`${deffer.status} - ${message}`);
            }
        }
    }
    
    function getRemotePath(url) {
        if (reqOptions.remoteServerBase) return reqOptions.remoteServerBase + url;
        
        return url;
    };
    
    function setToken(token) {
        if (!token) return;
        reqOptions.token = token;
        if (window.sessionStorage) {
            window.sessionStorage.token = token;
        }
    }
}


/**
 * @param {String|urlQuery} url
 * @param {function(error: Object, res: Object)} callback
 * @param { {[$$requestOptions]:Object, ...} } [data]
 * */
export function post(url, callback, data) {
    return request(url, callback, data, 'post');
}

function $request(url, data, type = 'get') {
    return new Promise((resolve, reject) => request(url, (error, res) => {
        if (error) {
            let err = error instanceof Error ? error : new Error(_.isObject(error) ? error.message : error);
            _.map(err, (value, key) => {
                err[key] = value;
            });
            return reject(err);
        }
        
        return resolve(res);
    }, data, type));
}

/** @returns {Promise} */
export function $get(url, data) {
    return $request(url, data)
}

/** @returns {Promise} */
export function $post(url, data) {
    return $request(url, data, 'post');
}

/**
 * @namespace requestHelper#urlQuery
 * @class urlQuery
 * @returns {urlQuery}
 * */
export function urlQuery(queryStr, route) {
    if (!(this instanceof urlQuery)) {
        return new urlQuery(queryStr, route);
    }
    
    /** @lends urlQuery.prototype */
    var api = this;
    
    /** @field */
    api.route = route || {};
    
    /** @field */
    api.queryString = (function () {
        if (queryStr.indexOf('?') < 0) {
            return {};
        }
        var urlParams = {},
            e,
            d = function (s) {
                return decodeURIComponent(s.replace(/\+/g, " "));
            },
            q = queryStr.substring(queryStr.indexOf('?') + 1),
            r = /([^&=]+)=?([^&]*)/g;
        
        while (e = r.exec(q))
            urlParams[d(e[1])] = d(e[2]);
        
        return urlParams;
    })();
    
    
    var setParam = function (key, value) {
        var hasKey = false;
        Object.keys(api.queryString).forEach(function (k, v) {
            if (key.toLowerCase() == k.toLowerCase()) {
                hasKey = true;
                api.queryString[k] = value;
            }
        });
        if (!hasKey) {
            api.queryString[key] = (value && typeof value === 'object' ) ? JSON.stringify(value) : value;
        }
        return api;
    };
    
    var getParam = function (key) {
        var val;
        Object.keys(api.queryString).forEach(function (k) {
            var v = api.queryString[k];
            if (key.toLowerCase() == k.toLowerCase()) {
                val = v;
            }
        });
        return val;
    };
    
    /** @returns {urlQuery} */
    api.param = function (key, value) {
        if (arguments.length == 0) {
            return api.queryString;
        }
        if (arguments.length == 1) {
            if (typeof key == 'string') {
                return getParam(key);
            } else if (typeof key == 'object') {
                for (var k in key) {
                    setParam(k, key[k]);
                }
            }
            return this;
        }
        if (arguments.length == 2) {
            return setParam(key, value);
        }
    };
    
    /** @returns {urlQuery}*/
    api.setRoute = function (routeConfig) {
        $.extend(api.route, routeConfig);
        return this;
    };
    
    api.parseRoute = function (routeFormat) {
        var routes = {};
        var queryPath = queryStr.split('/');
        var reg = /^\:/;
        routeFormat.split('/').forEach((route, index) => {
            if (reg.test(route)) {
                routes[route.replace(reg, '')] = queryPath[index];
            }
        });
        
        return routes;
    };
    
    /**
     * @returns {String}
     * */
    api.getUrl = function () {
        var url = this.getPathName();
        
        if (url.indexOf('?') < 0) {
            url = url + '?';
        }
        
        for (var p in api.queryString) {
            if (api.queryString[p] != null) {
                url += p + '=' + encodeURIComponent(api.queryString[p]) + "&";
            }
        }
        
        if (url.lastIndexOf('&') == url.length - 1) {
            url = url.substring(0, url.lastIndexOf('&'));
        }
        
        if (url.lastIndexOf('?') == url.length - 1) {
            url = url.substring(0, url.lastIndexOf('?'));
        }
        
        Object.keys(api.route).forEach(function (routeName) {
            var routeValue = api.route[routeName];
            url = url.replace(new RegExp('\/\:' + routeName, 'gi'), routeValue ? ('/' + routeValue) : '');
        });
        
        return url;
    };
    
    api.getPathName = function () {
        return queryStr.split('?')[0].toLowerCase();
    };
    
    api.hasSamePath = function (url) {
        return urlQuery(url).getPathName() === api.getPathName();
    };
    
    /** @returns {String} */
    api.toString = function () {
        return this.getUrl();
    };
    
    return api;
}

export function postForm(form, callback, query) {
    var $form = $(form)
        , url = $form.attr('action');
    
    post(urlQuery(url).param(query).getUrl(), callback, $form.serialize());
}

$.ajaxPrefilter(function (options, originalOptions, jqXHR) {
    if (options.dataType == 'script' || originalOptions.dataType == 'script') {
        options.cache = true;
    }
});

export function resolveResourcePath(path) {
    if (!path) {
        return path;
    }
    
    let publicPath = getBuildPathBase();
    if (!publicPath) {
        return path;
    }
    
    const INNER_PROTO = '$:';
    const INNER_PROTO_SPLASH = `${INNER_PROTO}/`;
    
    publicPath = publicPath.replace(/\/$/, '');
    
    if (path.indexOf(INNER_PROTO) === 0 && path.indexOf(INNER_PROTO_SPLASH) !== 0) {
        path = path.replace(INNER_PROTO, INNER_PROTO_SPLASH)
    }
    
    if (path.indexOf(INNER_PROTO_SPLASH) === 0) {
        return path.replace(INNER_PROTO, publicPath.replace(/\/$/, ''));
    } else {
        return path;
    }
    
}

export function getScript(url, done = e => 1) {
    url = resolveResourcePath(url);
    
    if (!getScript._caches) {
        getScript._caches = {};
    }
    if (getScript._caches[url]) {
        return done();
    }
    getScript._caches[url] = true;
    var script = document.createElement('script');
    script.src = url;
    document.head.appendChild(script);
    script.onload = done;
}

export function getBuildPathBase() {
    return window.APP_PUBLIC_PATH || APP_BUILD_PATH;
}

export function getBuildFilePath(url) {
    return `${getBuildPathBase()}/${url}`;
}

export function getBuildScript(url, done) {
    return getScript(getBuildFilePath(url), done);
}

export function getBowerFilePath(url) {
    return `$:/bower_components/${url}`;
}

export function getBowerStyle(url, done) {
    return getStyleFile(getBowerFilePath(url), done);
}

export function getStyleFile(url, done = e => 1) {
    url = resolveResourcePath(url);
    
    if (!getStyleFile._caches) {
        getStyleFile._caches = {};
    }
    if (getStyleFile._caches[url]) {
        return done();
    }
    getStyleFile._caches[url] = true;
    var style = document.createElement('link');
    style.type = "text/css";
    style.rel = "stylesheet";
    style.href = url;
    document.head.appendChild(style);
    style.onload = done;
}

export function getBowerScript(url, done = e => 1) {
    return getScript(getBowerFilePath(url), done)
}

/** @method */
String.prototype.urlQuery = function () {
    return new urlQuery(this);
};