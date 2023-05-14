import { Extensions } from '@klient/core';

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

export const extension = {
  name: '@klient/mock',
  initialize: (klient: Klient<Parameters>) => {
    const mocks = new Mocks(klient);

    klient.services.set('mocks', mocks);

    // prettier-ignore
    klient
      .extends('mocks', mocks)
      .extends('mock', (...collection: Mock[]) => {
        mocks.mock(...collection);
        return klient;
      });

    mocks.mock(...((klient.parameters.get('mock.load') || []) as Mock[]));
  }
};

Extensions.push(extension);
