"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const partialDeepEqual = (obj, target) => {
    for (const prop in obj) {
        if (!target.hasOwnProperty(prop)) {
            return false;
        }
        if (obj[prop] !== null &&
            typeof obj[prop] === 'object' &&
            target[prop] !== null &&
            typeof target[prop] === 'object') {
            if (!partialDeepEqual(obj[prop], target[prop])) {
                return false;
            }
        }
        else if (obj[prop] !== target[prop]) {
            return false;
        }
    }
    return true;
};
exports.default = partialDeepEqual;
