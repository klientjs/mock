import Klient, { RequestEvent } from '@klient/core';

import '../src';

import type { Parameters, KlientExtended, Mock } from '../src';

jest.useFakeTimers();
jest.spyOn(global, 'setTimeout');

test('register', () => {
  const klient = new Klient();

  expect(klient.extensions.includes('@klient/mock')).toBeTruthy();
});

test('mock', async () => {
  const klient = new Klient<Parameters>({
    mock: {
      load: [
        {
          req: {
            url: '/auth',
            method: 'POST'
          },
          res: (config) => {
            if (!config.data?.username) {
              return {
                status: 400,
                data: {
                  username: 'this property is required'
                }
              };
            }

            if (!config.data?.password) {
              return {
                status: 400,
                data: {
                  password: 'this property is required'
                }
              };
            }

            return {
              status: 200,
              data: {
                token: '...'
              }
            };
          }
        },
        {
          req: {
            url: '/posts',
            params: {
              test: 1
            }
          },
          res: {
            status: 200,
            data: [
              {
                title: 'test',
                content: 'test'
              }
            ]
          }
        },
        {
          req: {
            url: '/posts/{id}',
            method: 'GET'
          },
          res: (_config, parameters) => {
            return {
              status: 200,
              data: {
                id: parameters.id,
                title: 'test'
              }
            };
          }
        }
      ]
    }
  }) as KlientExtended;

  const mock: Mock = {
    delay: 20,
    req: { url: '/error' },
    res: { status: 500 }
  };

  klient.mock(mock);

  await klient
    .request({
      url: '/auth',
      method: 'POST'
    })
    .then(() => {
      throw new Error('This request must failed');
    })
    .catch((e) => {
      expect(e.response.status).toBe(400);
      expect(e.response.data.username).toBeDefined();
    });

  await klient
    .request({
      url: '/auth',
      method: 'POST',
      data: {
        username: 'test',
        password: 'test'
      }
    })
    .then(({ status, data }) => {
      expect(status).toBe(200);
      expect((data as { token: string }).token).toBe('...');
    })
    .catch((e) => {
      console.log(e);
      throw e;
    });

  await klient
    .request({
      url: '/posts',
      method: 'GET',
      params: {
        test: 1
      }
    })
    .then(({ status }) => {
      expect(status).toBe(200);
    })
    .catch((e) => {
      console.log(e);
      throw e;
    });

  const req = klient.request({ url: '/error' });

  jest.runAllTimers();

  req
    .then(() => {
      throw new Error('This request must failed');
    })
    .catch((e) => {
      expect(e.response.status).toBe(500);
      expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 20);
    });

  await klient
    .request({ url: '/posts/1', method: 'GET' })
    .then(({ data }) => {
      expect((data as { id: string }).id).toBe('1');
    })
    .catch((e) => {
      console.log(e);
      throw e;
    });

  const cancelRequest = (e: RequestEvent) => {
    e.request.cancel();
  };

  klient.on('request', cancelRequest, -1004);

  await klient
    .request({
      url: '/posts',
      method: 'GET',
      params: {}
    })
    .then(() => {
      throw new Error('This request must failed');
    })
    .catch((e) => {
      expect(klient.isCancel(e)).toBeTruthy();
    });

  klient.off('request', cancelRequest).on('request', cancelRequest);

  await klient
    .request({ url: '/posts/1', method: 'GET' })
    .then(() => {
      throw new Error('This request must failed');
    })
    .catch((e) => {
      expect(klient.isCancel(e)).toBeTruthy();
    });
});
