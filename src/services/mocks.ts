import { AxiosError } from 'axios';
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
    klient.on('request', this.match.bind(this), -1001);
    klient.on('request', this.delay.bind(this), -1002);
    klient.on('request', Mocks.handle, -1003);
  }

  mock(...mocks: Mock[]): this {
    this.mocks.push(...mocks);
    return this;
  }

  private match(e: RequestEvent) {
    if ((e.config.signal as AbortSignal).aborted) {
      return;
    }

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

  private delay(e: RequestEvent) {
    const { config, context } = e;
    const { mock } = context as { mock?: Mock };

    if ((config.signal as AbortSignal).aborted || !mock) {
      return;
    }

    const delay = mock.delay !== undefined ? mock.delay : this.klient.parameters.get('mock.delay');
    if (typeof delay === 'number') {
      return new Promise<void>((r) => {
        setTimeout(r, delay);
      });
    }
  }

  private static handle(e: RequestEvent) {
    const { config, context, request } = e;
    const { mock, parameters } = context as { mock?: Mock; parameters: unknown };

    if ((config.signal as AbortSignal).aborted || !mock) {
      return;
    }

    request.handler = () => {
      const result = typeof mock.res === 'function' ? mock.res(config, parameters as ResParameters) : mock.res;
      const { status } = result;

      if (status >= 200 && status < 400) {
        return Promise.resolve(result as AxiosResponse);
      }

      const err = new AxiosError();

      err.message = statusCodes.getStatusText(status);
      err.code = AxiosError.ERR_BAD_RESPONSE;
      err.config = e.config;
      err.response = result as AxiosResponse;

      return Promise.reject(err);
    };
  }
}
