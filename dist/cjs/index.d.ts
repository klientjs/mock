import type Klient from '@klient/core';
import type { Parameters as KlientParameters } from '@klient/core';
import Mocks, { Mock } from './services/mocks';
export { Mock } from './services/mocks';
export interface Parameters extends KlientParameters {
    mock?: {
        delay?: number;
        load?: Mock[];
    };
}
export interface KlientExtended extends Klient<Parameters> {
    mocks: Mocks;
    mock(...collection: Mock[]): KlientExtended;
}
export declare const extension: {
    name: string;
    initialize: (klient: Klient<Parameters>) => void;
};
