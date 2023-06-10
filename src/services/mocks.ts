import { AxiosError, CanceledError } from 'axios';
import Klient, { RequestEvent, KlientRequestConfig } from '@klient/core';

import type { AxiosResponseHeaders, AxiosResponse } from 'axios';
import statusCodes from '../toolbox/status-codes';
import partialDeepEqual from '../toolbox/partial-deep-equal';
import extractParameters from '../toolbox/extract-parameters';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface PartialAxiosResponse<T = any> {
  status: number;
  data?: T;
  headers?: AxiosResponseHeaders;
  config?: KlientRequestConfig;
}

export type ResParameters = Record<string, unknown>;

export type Mock = {
  req: KlientRequestConfig;
  res: PartialAxiosResponse | ((config: KlientRequestConfig, parameters: ResParameters) => PartialAxiosResponse);
  delay?: number;
};

export default class Mocks {
  private mocks: Mock[] = [];

  constructor(private readonly klient: Klient) {
    klient.on('request', this.match.bind(this), -1000);
    klient.on('request', this.handle.bind(this), -Infinity);
  }

  mock(...mocks: Mock[]): this {
    this.mocks.push(...mocks);
    return this;
  }

  private match(e: RequestEvent) {
    const { config } = e;

    for (let i = 0, len = this.mocks.length, parameters: ResParameters = {}; i < len; i += 1) {
      const mock = this.mocks[i];
      const mockReq = { ...mock.req };

      parameters = {};

      if (mockReq.url && config.url) {
        parameters = extractParameters(mockReq.url, config.url) || {};
        // Found parameters means mock has matched request url
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

  private handle(e: RequestEvent) {
    const { context, request } = e;
    const { mock } = context as { mock?: Mock };

    if (!mock) {
      return;
    }

    const delay = mock.delay !== undefined ? mock.delay : this.klient.parameters.get('mock.delay');

    request.handler = () =>
      new Promise((resolve, reject) => {
        const callback = () => {
          try {
            resolve(Mocks.renderResponse(e));
          } catch (err) {
            reject(err);
          }
        };

        if (typeof delay === 'number') {
          setTimeout(callback, delay);
        } else {
          callback();
        }
      });
  }

  private static renderResponse(e: RequestEvent) {
    const { config, context } = e;
    const { mock, parameters } = context as { mock: Mock; parameters: unknown };

    // Cancel
    if ((config.signal as AbortSignal).aborted) {
      const err = new CanceledError();

      err.message = AxiosError.ERR_CANCELED;
      err.code = AxiosError.ERR_CANCELED;
      err.config = e.config;

      throw err;
    }

    const result = typeof mock.res === 'function' ? mock.res(config, parameters as ResParameters) : mock.res;
    const { status } = result;

    // Success
    if (status >= 200 && status < 400) {
      return result as AxiosResponse;
    }

    // Error
    const err = new AxiosError();

    err.message = statusCodes.getStatusText(status);
    err.code = AxiosError.ERR_BAD_RESPONSE;
    err.config = e.config;
    err.response = result as AxiosResponse;

    throw err;
  }
}
