import { AxiosError, CanceledError } from 'axios';
import statusCodes from '../toolbox/status-codes';
import partialDeepEqual from '../toolbox/partial-deep-equal';
import extractParameters from '../toolbox/extract-parameters';
export default class Mocks {
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
                parameters = extractParameters(mockReq.url, config.url) || {};
                if (parameters && Object.keys(parameters).length > 0) {
                    delete mockReq.url;
                }
            }
            if (partialDeepEqual(mockReq, config)) {
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
            const err = new CanceledError();
            err.message = AxiosError.ERR_CANCELED;
            err.code = AxiosError.ERR_CANCELED;
            err.config = e.config;
            throw err;
        }
        const result = typeof mock.res === 'function' ? mock.res(config, parameters) : mock.res;
        const { status } = result;
        if (status >= 200 && status < 400) {
            return result;
        }
        const err = new AxiosError();
        err.message = statusCodes.getStatusText(status);
        err.code = AxiosError.ERR_BAD_RESPONSE;
        err.config = e.config;
        err.response = result;
        throw err;
    }
}
