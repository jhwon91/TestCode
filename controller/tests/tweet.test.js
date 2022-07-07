import faker from 'faker';
import { TweetController } from '../tweet.js';
import httpMocks from 'node-mocks-http';

describe('TweetController', () => {
	let tweetController;
	let tweetRepository;
	let mockedSocket;

	beforeEach(() => {
		tweetRepository = {};
		mockedSocket = { emit: jest.fn() };
		tweetController = new TweetController(tweetRepository, () => mockedSocket);
	});

	describe('getTweets', () => {
		it('returns all tweets when username is not provided', async () => {
			const requset = httpMocks.createRequest();
			const response = httpMocks.createResponse();
			const allTweets = [
				{ text: faker.random.words(3) },
				{ text: faker.random.words(3) },
			];

			tweetRepository.getAll = () => allTweets;
			await tweetController.getTweets(requset, response);

			expect(response.statusCode).toBe(200);
			expect(response._getJSONData()).toEqual(allTweets);
		})

		it('returns tweets for the given user when username is provided', async () => {
			const username = faker.internet.userName();
			const requset = httpMocks.createRequest({
				query: { username },
			});
			const response = httpMocks.createResponse();
			const userTweets = [
				{ text: faker.random.words(3) },
			];

			tweetRepository.getAllByUsername = () => userTweets;
			await tweetController.getTweets(requset, response);

			expect(response.statusCode).toBe(200);
			expect(response._getJSONData()).toEqual(userTweets);
		})
	});

	describe('getTweet', () => {
		let tweetId, request, response;

		beforeEach(() => {
			tweetId = faker.random.alphaNumeric(16);
			request = httpMocks.createRequest({
				params: { id: tweetId },
			});
			response = httpMocks.createResponse();
		});

		it('returns the tweet if tweet exists', async () => {
			const aTweet = { text: faker.random.words(3) }
			tweetRepository.getById = jest.fn(() => aTweet);

			await tweetController.getTweet(request, response);

			expect(response.statusCode).toBe(200);
			expect(response._getJSONData()).toEqual(aTweet);
			expect(tweetRepository.getById).toHaveBeenCalledWith(tweetId);
		})

		it('returns 404 if tweet does not exist', async () => {
			tweetRepository.getById = jest.fn(() => undefined);

			await tweetController.getTweet(request, response);

			expect(response.statusCode).toBe(404);
			expect(response._getJSONData()).toMatchObject({
				message: `Tweet id(${tweetId}) not found`
			});
			expect(tweetRepository.getById).toHaveBeenCalledWith(tweetId);
		})
	})

	describe('createTweet', () => {
		let newTweet, authorId, request, response;
		beforeEach(() => {
			newTweet = faker.random.words(3);
			authorId = faker.random.alphaNumeric(16);
			request = httpMocks.createRequest({
				body: { text: newTweet },
				userId: authorId
			})
			response = httpMocks.createResponse();
		})

		it('returns 201 with created tweet object including userId', async () => {
			tweetRepository.create = jest.fn((text, userId) => ({
				text,
				userId,
			}));

			await tweetController.createTweet(request, response);

			expect(response.statusCode).toBe(201);
			expect(response._getJSONData()).toMatchObject({
				text: newTweet,
				userId: authorId,
			});
			expect(tweetRepository.create).toHaveBeenCalledWith(newTweet, authorId);
		});

		it('should send an event to a websocket channel', async () => {
			tweetRepository.create = jest.fn((text, userId) => ({
				text: text,
				userId: userId,
			}));

			await tweetController.createTweet(request, response);

			expect(mockedSocket.emit).toHaveBeenCalledWith('tweets', {
				text: newTweet,
				userId: authorId,
			});
		});
	})

	describe('updateTweet', () => {
		let tweetId, updatedTweet, authorId, request, response
		beforeEach(() => {
			tweetId = faker.random.alphaNumeric(16);
			updatedTweet = faker.random.words(3);
			authorId = faker.random.alphaNumeric(16);
			request = httpMocks.createRequest({
				params: { id: tweetId },
				body: { text: updatedTweet },
				userId: authorId,
			})
			response = httpMocks.createResponse();
		})

		it('업데이트 성공', async () => {
			tweetRepository.getById = () => ({
				text: faker.random.words(3),
				userId: authorId
			});
			tweetRepository.update = (tweetId, newTweet) => ({
				text: newTweet
			});

			await tweetController.updateTweet(request, response);

			expect(response.statusCode).toBe(200);
			expect(response._getJSONData()).toMatchObject({
				text: updatedTweet,
			});
		})

		it('해당 아이디가 없는경우', async () => {
			tweetRepository.getById = () => ({
				text: faker.random.words(3),
				userId: faker.random.alphaNumeric(16)
			});

			await tweetController.updateTweet(request, response);

			expect(response.statusCode).toBe(403);
		})

		it('업데이트하고자하는 트윗이 존재하지 않으면', async () => {
			tweetRepository.getById = () => undefined;
			// tweetRepository.update = jest.fn();

			await tweetController.updateTweet(request, response);

			expect(response.statusCode).toBe(404);
			expect(response._getJSONData()).toMatchObject({
				message: `Tweet not found: ${tweetId}`
			});
		})
	})

	describe('deleteTweet', () => {
		let tweetId, authorId, request, response
		beforeEach(() => {
			tweetId = faker.random.alphaNumeric(16);
			authorId = faker.random.alphaNumeric(16);
			request = httpMocks.createRequest({
				params: { id: tweetId },
				userId: authorId,
			})
			response = httpMocks.createResponse();
		})

		it('삭제 성공', async () => {
			tweetRepository.getById = () => ({
				userId: authorId
			});
			tweetRepository.remove = jest.fn();

			await tweetController.deleteTweet(request, response);

			expect(response.statusCode).toBe(204);
			expect(tweetRepository.remove).toHaveBeenCalledWith(tweetId);
		})

		it('해당 아이디가 없는경우', async () => {
			tweetRepository.getById = () => ({
				text: faker.random.words(3),
				userId: faker.random.alphaNumeric(16)
			});

			await tweetController.deleteTweet(request, response);

			expect(response.statusCode).toBe(403);
		})

		it('삭제하고자하는 트윗이 존재하지 않으면', async () => {
			tweetRepository.getById = () => undefined;

			await tweetController.deleteTweet(request, response);

			expect(response.statusCode).toBe(404);
			expect(response._getJSONData()).toMatchObject({
				message: `Tweet not found: ${tweetId}`
			});
		})
	})

})