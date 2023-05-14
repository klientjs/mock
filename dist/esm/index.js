import { Extensions } from '@klient/core';
import Mocks from './services/mocks';
export const extension = {
    name: '@klient/mock',
    initialize: (klient) => {
        const mocks = new Mocks(klient);
        klient.services.set('mocks', mocks);
        klient
            .extends('mocks', mocks)
            .extends('mock', (...collection) => {
            mocks.mock(...collection);
            return klient;
        });
        mocks.mock(...(klient.parameters.get('mock.load') || []));
    }
};
Extensions.push(extension);
