# Klient Mock

![badge-coverage](.github/badges/coverage.svg)

- [Introduction](#introduction)
- [Setup](#setup)
- [Usage](#usage)
- [Parameters](#parameters)
- [Mock](#mock)

## Introduction

This [Klient](https://github.com/klientjs/core) extension allows you to mock Klient responses. That's means that you can work on an entrypoints even if it's not really ready yet.

## Setup

Install package with your favorite package manager :

```bash
# With NPM
$ npm install @klient/mock

# With YARN
$ yarn add @klient/mock
```

Then import the extension in your code :

```js
import Klient from '@klient/core';

//
// Register extension
//
import '@klient/mock';


//
// Build Klient instance
//
const klient = new Klient('...');


//
// See loaded extension
//
console.log(klient.extensions); // Print ["@klient/mock"]
```

## Usage

```js
import Klient from '@klient/core';

//
// Register extension
//
import '@klient/mock';


//
// Build Klient instance
//
const klient = new Klient(...);


//
// Mock a route - see Mock method doc for more details
//
klient.mock({
  req: { url: '/posts' },         // Request criterias
  res: { status: 200, data: [] }  // Mocked response
});


//
// Consume a mocked route
//
klient.request('/posts').then(response => {
  console.log(response.data); // Print []
});
```

## Parameters

```js
const klient = new Klient({
  delay: 800, // Default response delay to apply to all responses (milliseconds)
  mock: {
    // This parameter is analyzed only on Klient instanciation 
    load: [
      // Mock GET /posts
      {
        delay: 800,  // Simulate response delay (milliseconds)
        req: { url: '/posts' },
        res: { status: 200, data: [] }
      },
    ]
  }
});
```


## Mock

A mock is a fake response build for a request whose matches some criterias.

The mocked response must be an object contening at least the "status" property. It must contains only Axios object properties, that will be "normalized" by mock extension to a final Axios result. The returned status code determines if the request must be rejected or resolved (as Axios does).

To match a mock, the request config must contain all properties/values defined in criterias (it's not strict, request config can contains more properties not defined in criterias). The mock request url can contains dynamic parameters whoses will be treated separately of the rest of config, then they will be injected in mock response callback if match.

```typescript
mock({
  req: AxiosRequestConfig,
  res: AxiosResponse | ((config: AxiosRequestConfig, parameters: object) => AxiosResponse)
}): Klient

// Can be multiple
mock(...Mocks): Klient
```

*Example*

```js
import Klient from '@klient/core';

//
// Register extension
//
import '@klient/mock';


//
// Build Klient instance
//
const klient = new Klient(...);


//
// Mock a route
//
klient.mock({
  req: { url: '/posts' },         // Request criterias
  res: { status: 200, data: [] }  // Mocked response
});


//
// Mock multiple routes
//
klient.mock(
  {
    req: { url: '/posts', method: 'GET' },
    res: { status: 200, data: [] }
  },
  {
    req: { url: '/posts', method: 'POST' },
    res: { status: 400, data: {...} }
  }
);


//
// Mock complexe routes
//
klient.mock({
  delay: 600, // (milliseconds)
  req: { url: '/posts', method: 'POST' },
  // Use a callback to make complex response
  res: (config) => {
    // Simulate API validation errors
    if (!config.data.title) {
      return { status: 400, data: {...} };
    }

    return { status: 200, data: {...} };
  }
});

//
// Mock routes with params
//
klient.mock({
  req: { url: '/posts/{id}', method: 'GET' },
  // Use a callback to make complex response
  res: (config, parameters) => {
    // Simulate API not found
    if (parameters.id !== '1') {
      return {
        status: 404,
        data: {...}
      };
    }

    return { status: 200, data: {...} };
  }
});
```
