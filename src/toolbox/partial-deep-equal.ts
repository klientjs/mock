/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-prototype-builtins */

const partialDeepEqual = (obj: any, target: any) => {
  for (const prop in obj) {
    if (!target.hasOwnProperty(prop)) {
      return false;
    }

    if (
      obj[prop] !== null &&
      typeof obj[prop] === 'object' &&
      target[prop] !== null &&
      typeof target[prop] === 'object'
    ) {
      if (!partialDeepEqual(obj[prop], target[prop])) {
        return false;
      }
    } else if (obj[prop] !== target[prop]) {
      return false;
    }
  }

  return true;
};

export default partialDeepEqual;
