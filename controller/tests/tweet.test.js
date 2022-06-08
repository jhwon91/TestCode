import facker from 'faker';
import { TweetController } from '../tweet';
import httpMocks from 'node-mocks-http';
import faker from 'faker';

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
			tweetRepository.create = jest.fn((text, userId) => {
				text,
					userId
			});

			await tweetController.createTweet(request, response);

			expect(response.statusCode).toBe(201);
			expect(response._getJSONData()).toMatchObject({
				text: newTweet,
				userId: authorId,
			});
			expect(tweetRepository.create).toHaveBeenCalledWith(newTweet, authorId);
		})
	})

	describe('updateTweet', () => {
		it('returns all tweets when username is not provided', async () => {
		})
	})

	describe('deleteTweet', () => {
		it('returns all tweets when username is not provided', async () => {
		})
	})

})