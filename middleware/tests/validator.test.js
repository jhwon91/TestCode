import httpMocks from 'node-mocks-http';
import { validate } from '../validator'
import faker from 'faker';
import * as validator from 'express-validator'

jest.mock('express-validator')

describe('Validator Middleware', () => {
	it('calls next if there ard no validation errors', () => {
		const request = httpMocks.createRequest();
		const response = httpMocks.createResponse();
		const next = jest.fn();
		validator.validationResult = jest.fn(() => ({ isEmpty: () => true }));

		validate(request, response, next);

		expect(next).toBeCalled();
	})

	it('return 400 if there ard validation errors', () => {
		const request = httpMocks.createRequest();
		const response = httpMocks.createResponse();
		const errorMsg = faker.random.words(3);
		const next = jest.fn();
		validator.validationResult = jest.fn(() => ({
			isEmpty: () => false,
			array: () => [{ msg: errorMsg }]
		}));

		validate(request, response, next);

		expect(next).not.toBeCalled();
		expect(response.statusCode).toBe(400);
		expect(response._getJSONData().message).toBe(errorMsg);
	})
})