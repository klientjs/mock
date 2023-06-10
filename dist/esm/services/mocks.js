import { AxiosError } from 'axios';
import statusCodes from '../toolbox/status-codes';
import partialDeepEqual from '../toolbox/partial-deep-equal';
import extractParameters from '../toolbox/extract-parameters';
export default class Mocks {
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
            const err = new AxiosError();
            err.message = statusCodes.getStatusText(status);
            err.code = AxiosError.ERR_BAD_RESPONSE;
            err.config = e.config;
            err.response = result;
            return Promise.reject(err);
        };
    }
}
