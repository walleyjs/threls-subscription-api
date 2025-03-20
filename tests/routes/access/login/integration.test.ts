jest.resetAllMocks(); // make sure we do not have any mocks set from unit tests

import supertest from 'supertest';
import app from '../../../../src/app';
import UserRepo from '../../../../src/database/repository/UserRepo';
import KeystoreRepo from '../../../../src/database/repository/KeystoreRepo';
import User, { UserModel, RoleCode } from '../../../../src/database/model/User';
import bcrypt from 'bcrypt';
import * as authUtils from '../../../../src/auth/authUtils';
import { connection } from '../../../../src/database';

export const createTokensSpy = jest.spyOn(authUtils, 'createTokens');
export const bcryptCompareSpy = jest.spyOn(bcrypt, 'compare');
export const userFindByEmailSpy = jest.spyOn(UserRepo, 'findByEmail');
export const keystoreCreateSpy = jest.spyOn(KeystoreRepo, 'create');

describe('Login basic route', () => {
  const endpoint = '/login/basic';
  const request = supertest(app);
  const password = '123456';

  let user: User;

  beforeAll(async () => {
    await UserModel.deleteOne({}); // delete all data from user table
    user = await UserModel.create({
      firstName: 'abc',
      email: 'abc@xyz.com',
      password: bcrypt.hashSync(password, 10),
      status: true,
      updatedAt: new Date(),
      createdAt: new Date(),
      role: RoleCode.CUSTOMER,
    } as unknown as User);
   
  });

  afterAll(async () => {
    await UserModel.deleteOne({});
    connection.close();
   
  });


  beforeEach(() => {
    userFindByEmailSpy.mockClear();
    keystoreCreateSpy.mockClear();
    bcryptCompareSpy.mockClear();
    createTokensSpy.mockClear();
  });

  it('Should send error when empty body is sent', async () => {
    const response = await request.post(endpoint);
    expect(response.status).toBe(400);
    expect(userFindByEmailSpy).not.toHaveBeenCalled();
    expect(bcryptCompareSpy).not.toHaveBeenCalled();
    expect(keystoreCreateSpy).not.toHaveBeenCalled();
    expect(createTokensSpy).not.toHaveBeenCalled();
  });

  it('Should send error when email is only sent', async () => {
    const response = await 
      request.post(endpoint).send({ email: user.email })

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/password/);
    expect(userFindByEmailSpy).not.toHaveBeenCalled();
    expect(bcryptCompareSpy).not.toHaveBeenCalled();
    expect(keystoreCreateSpy).not.toHaveBeenCalled();
    expect(createTokensSpy).not.toHaveBeenCalled();
  });

  it('Should send error when password is only sent', async () => {
    const response = await 
      request.post(endpoint).send({ password: password })
    
    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/email/);
    expect(userFindByEmailSpy).not.toHaveBeenCalled();
    expect(bcryptCompareSpy).not.toHaveBeenCalled();
    expect(keystoreCreateSpy).not.toHaveBeenCalled();
    expect(createTokensSpy).not.toHaveBeenCalled();
  });

  it('Should send error when email is not valid format', async () => {
    const response = await 
      request.post(endpoint).send({ email: '123' })

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/valid email/);
    expect(userFindByEmailSpy).not.toHaveBeenCalled();
    expect(bcryptCompareSpy).not.toHaveBeenCalled();
    expect(keystoreCreateSpy).not.toHaveBeenCalled();
    expect(createTokensSpy).not.toHaveBeenCalled();
  });

  it('Should send error when password is not valid format', async () => {
    const response = await 
      request.post(endpoint).send({
        email: user.email,
        password: '123',
      })

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/password length/);
    expect(response.body.message).toMatch(/6 char/);
    expect(userFindByEmailSpy).not.toHaveBeenCalled();
    expect(bcryptCompareSpy).not.toHaveBeenCalled();
    expect(keystoreCreateSpy).not.toHaveBeenCalled();
    expect(createTokensSpy).not.toHaveBeenCalled();
  });

  it('Should send error when user not registered for email', async () => {
    const response = await 
      request.post(endpoint).send({
        email: '123@abc.com',
        password: password,
      })

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/not registered/);
    expect(userFindByEmailSpy).toHaveBeenCalledTimes(1);
    expect(bcryptCompareSpy).not.toHaveBeenCalled();
    expect(keystoreCreateSpy).not.toHaveBeenCalled();
    expect(createTokensSpy).not.toHaveBeenCalled();
  });

  it('Should send error for wrong password', async () => {
    const response = await 
      request.post(endpoint).send({
        email: user.email,
        password: 'abc123',
      })

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/authentication failure/i);
    expect(userFindByEmailSpy).toHaveBeenCalledTimes(1);
    expect(bcryptCompareSpy).toHaveBeenCalledTimes(1);
    expect(keystoreCreateSpy).not.toHaveBeenCalled();
    expect(createTokensSpy).not.toHaveBeenCalled();
  });

  it('Should send success response for correct credentials', async () => {
    const response = await 
      request.post(endpoint).send({
        email: user.email,
        password: password,
      })
    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/Success/i);
    expect(response.body.data).toBeDefined();

    expect(response.body.data.user).toHaveProperty('_id');
    expect(response.body.data.user).toHaveProperty('name');
    expect(response.body.data.user).toHaveProperty('roles');
    expect(response.body.data.user).toHaveProperty('profilePicUrl');

    expect(response.body.data.tokens).toBeDefined();
    expect(response.body.data.tokens).toHaveProperty('accessToken');
    expect(response.body.data.tokens).toHaveProperty('refreshToken');

    expect(userFindByEmailSpy).toHaveBeenCalledTimes(1);
    expect(keystoreCreateSpy).toHaveBeenCalledTimes(1);
    expect(bcryptCompareSpy).toHaveBeenCalledTimes(1);
    expect(createTokensSpy).toHaveBeenCalledTimes(1);

    expect(bcryptCompareSpy).toHaveBeenCalledWith(password, user.password);
  });
});

export const addHeaders = (request: any) =>
  request.set('Content-Type', 'application/json')
