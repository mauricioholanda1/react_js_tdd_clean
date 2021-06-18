import {RemoteAuthentication} from './remote-authentication';
import faker from 'faker';
import {mockAuthentication} from '@/domain/test/mock-authentication';
import {HttpPostClientSpy} from '@/data/test/mock-http-client';
import {InvalidCredentialsError} from '@/domain/errors/invalid-credentials-error';
import {HttpStatusCode} from '@/data/protocols/http/http-response';
import {UnexpectedError} from '@/domain/errors/unexpected-error';
import {AuthenticationParams} from '@/domain/usecases/authentication';
import {AccountModel} from '@/domain/models/account-model';

type SutTypes = {
  sut: RemoteAuthentication;
  httpPostClientSpy: HttpPostClientSpy<AuthenticationParams, AccountModel>;
};

const makeSut = (url: string = faker.internet.url()): SutTypes => {
  const httpPostClientSpy = new HttpPostClientSpy<
    AuthenticationParams,
    AccountModel
  >();
  const sut = new RemoteAuthentication(url, httpPostClientSpy);
  return {sut, httpPostClientSpy};
};

describe('RemoteAuthentication', () => {
  test('Shoud call HttpPostClient with corret URL', async () => {
    const url = faker.internet.url();
    const {sut, httpPostClientSpy} = makeSut(url);
    await sut.auth(mockAuthentication());
    expect(httpPostClientSpy.url).toBe(url);
  });

  test('Shoud call HttpPostClient with corret body', async () => {
    const {sut, httpPostClientSpy} = makeSut();
    const authenticationParams = mockAuthentication();
    await sut.auth(authenticationParams);
    expect(httpPostClientSpy.body).toEqual(authenticationParams);
  });

  test('Shoud throw invalidCredentialError if HttpPostClient return 401', async () => {
    const {sut, httpPostClientSpy} = makeSut();
    httpPostClientSpy.response = {
      statusCode: HttpStatusCode.unathorized,
    };
    const promise = sut.auth(mockAuthentication());
    await expect(promise).rejects.toThrow(new InvalidCredentialsError());
  });

  test('Shoud throw UnexpectedError if HttpPostClient return 500', async () => {
    const {sut, httpPostClientSpy} = makeSut();
    httpPostClientSpy.response = {
      statusCode: HttpStatusCode.serverError,
    };
    const promise = sut.auth(mockAuthentication());
    await expect(promise).rejects.toThrow(new UnexpectedError());
  });

  test('Shoud throw UnexpectedError if HttpPostClient return 404', async () => {
    const {sut, httpPostClientSpy} = makeSut();
    httpPostClientSpy.response = {
      statusCode: HttpStatusCode.notFound,
    };
    const promise = sut.auth(mockAuthentication());
    await expect(promise).rejects.toThrow(new UnexpectedError());
  });
});
