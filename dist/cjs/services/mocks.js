"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const status_codes_1 = require("../toolbox/status-codes");
const partial_deep_equal_1 = require("../toolbox/partial-deep-equal");
const extract_parameters_1 = require("../toolbox/extract-parameters");
class Mocks {
    constructor(klient) {
        this.klient = klient;
        this.mocks = [];
        klient.on('request', this.match.bind(this), -1000);
        klient.on('request', this.handle.bind(this), -Infinity);
    }
    mock(...mocks) {
        this.mocks.push(...mocks);
        return this;
    }
    match(e) {
        const { config } = e;
        for (let i = 0, len = this.mocks.length, parameters = {}; i < len; i += 1) {
            const mock = this.mocks[i];
            const mockReq = Object.assign({}, mock.req);
            parameters = {};
            if (mockReq.url && config.url) {
                parameters = (0, extract_parameters_1.default)(mockReq.url, config.url) || {};
                if (parameters && Object.keys(parameters).length > 0) {
                    delete mockReq.url;
                }
            }
            if ((0, partial_deep_equal_1.default)(mockReq, config)) {
                e.context.mock = mock;
                e.context.parameters = parameters;
                break;
            }
        }
    }
    handle(e) {
        const { context, request } = e;
        const { mock } = context;
        if (!mock) {
            return;
        }
        const delay = mock.delay !== undefined ? mock.delay : this.klient.parameters.get('mock.delay');
        request.handler = () => new Promise((resolve, reject) => {
            const callback = () => {
                try {
                    resolve(Mocks.renderResponse(e));
                }
                catch (err) {
                    reject(err);
                }
            };
            if (typeof delay === 'number') {
                setTimeout(callback, delay);
            }
            else {
                callback();
            }
        });
    }
    static renderResponse(e) {
        const { config, context } = e;
        const { mock, parameters } = context;
        if (config.signal.aborted) {
            const err = new axios_1.CanceledError();
            err.message = axios_1.AxiosError.ERR_CANCELED;
            err.code = axios_1.AxiosError.ERR_CANCELED;
            err.config = e.config;
            throw err;
        }
        const result = typeof mock.res === 'function' ? mock.res(config, parameters) : mock.res;
        const { status } = result;
        if (status >= 200 && status < 400) {
            return result;
        }
        const err = new axios_1.AxiosError();
        err.message = status_codes_1.default.getStatusText(status);
        err.code = axios_1.AxiosError.ERR_BAD_RESPONSE;
        err.config = e.config;
        err.response = result;
        throw err;
    }
}
exports.default = Mocks;
