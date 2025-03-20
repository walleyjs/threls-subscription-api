import '../../database/mock';

import {
  ACCESS_TOKEN,
  addAuthHeaders,
  mockUserFindById,
  mockJwtValidate,
  mockKeystoreFindForKey,
  getAccessTokenSpy,
} from './mock';

import app from '../../../src/app';
import supertest from 'supertest';

describe('authentication validation', () => {
  const endpoint = '/profile/my/test';
  const request = supertest(app);

  beforeEach(() => {
    getAccessTokenSpy.mockClear();
    mockJwtValidate.mockClear();
    mockUserFindById.mockClear();
    mockKeystoreFindForKey.mockClear();
  });


  it('Should response with 404 if correct Authorization header is provided', async () => {
    const response = await addAuthHeaders(request.get(endpoint));
    expect(response.body.message).not.toMatch(/not registered/);
    expect(response.body.message).not.toMatch(/token/i);
    expect(response.status).toBe(404);
    expect(getAccessTokenSpy).toHaveBeenCalledTimes(1);
    expect(getAccessTokenSpy).toHaveBeenCalledWith(`Bearer ${ACCESS_TOKEN}`);
    expect(getAccessTokenSpy).toHaveReturnedWith(ACCESS_TOKEN);
    expect(mockJwtValidate).toHaveBeenCalledTimes(1);
    expect(mockJwtValidate).toHaveBeenCalledWith(ACCESS_TOKEN);
    expect(mockUserFindById).toHaveBeenCalledTimes(1);
    expect(mockKeystoreFindForKey).toHaveBeenCalledTimes(1);
  });
});
