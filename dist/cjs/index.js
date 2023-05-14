"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extension = void 0;
const core_1 = require("@klient/core");
const mocks_1 = require("./services/mocks");
exports.extension = {
    name: '@klient/mock',
    initialize: (klient) => {
        const mocks = new mocks_1.default(klient);
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
core_1.Extensions.push(exports.extension);
