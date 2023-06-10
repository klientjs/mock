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
        klient.on('request', this.match.bind(this), -1001);
        klient.on('request', this.delay.bind(this), -1002);
        klient.on('request', Mocks.handle, -1003);
    }
    mock(...mocks) {
        this.mocks.push(...mocks);
        return this;
    }
    match(e) {
        if (e.config.signal.aborted) {
            return;
        }
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
    delay(e) {
        const { config, context } = e;
        const { mock } = context;
        if (config.signal.aborted || !mock) {
            return;
        }
        const delay = mock.delay !== undefined ? mock.delay : this.klient.parameters.get('mock.delay');
        if (typeof delay === 'number') {
            return new Promise((r) => {
                setTimeout(r, delay);
            });
        }
    }
    static handle(e) {
        const { config, context, request } = e;
        const { mock, parameters } = context;
        if (config.signal.aborted || !mock) {
            return;
        }
        request.handler = () => {
            const result = typeof mock.res === 'function' ? mock.res(config, parameters) : mock.res;
            const { status } = result;
            if (status >= 200 && status < 400) {
                return Promise.resolve(result);
            }
            const err = new axios_1.AxiosError();
            err.message = status_codes_1.default.getStatusText(status);
            err.code = axios_1.AxiosError.ERR_BAD_RESPONSE;
            err.config = e.config;
            err.response = result;
            return Promise.reject(err);
        };
    }
}
exports.default = Mocks;
