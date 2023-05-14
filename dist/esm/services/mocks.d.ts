import Klient, { KlientRequestConfig } from '@klient/core';
import type { AxiosResponseHeaders } from 'axios';
export interface PartialAxiosResponse<T = any> {
    status: number;
    data?: T;
    headers?: AxiosResponseHeaders;
    config?: KlientRequestConfig;
}
export declare type ResParameters = Record<string, unknown>;
export declare type Mock = {
    req: KlientRequestConfig;
    res: PartialAxiosResponse | ((config: KlientRequestConfig, parameters: ResParameters) => PartialAxiosResponse);
    delay?: number;
};
export default class Mocks {
    private readonly klient;
    private mocks;
    constructor(klient: Klient);
    mock(...mocks: Mock[]): this;
    private match;
    private delay;
    private static handle;
}
