import axios from 'axios';
import { sequelize } from '../../db/database.js';
import { startServer, stopServer } from '../../app.js';
import faker from 'faker';

describe ('Auth APIs', ()=> {
	let server;
	let request;
	beforeAll(async () => {
		server = await startServer();
		request = axios.create({
			baseURL: 'http://localhost:8080',
			validateStatus: null,
		})
	});

	afterAll(async () => {
		await sequelize.drop();
		await stopServer(server);
	});

	describe('POST to /auth/signup', ()=>{
		it('return 201 로그인이 정상적이라면 토큰 줘', async () =>{
			const user = makeValidUserDetails();

			const response = await request.post('/auth/signup', user);

			expect(response.status).toBe(201);
			expect(response.data.token.length).toBeGreaterThan(0)
		});

		it('return 409 이미 존재 하는 사용자', async () =>{
			const user = makeValidUserDetails();

			const firstSignup = await request.post('/auth/signup', user);
			expect(firstSignup.status).toBe(201);

			const response = await request.post('/auth/signup', user);
			expect(response.status).toBe(409);

			expect(response.data.message).toBe(`${user.username} already exists`)
		});

		test.each([
			{missingFieldName: 'name', expectedMessage: 'name is missing'},
			{missingFieldName: 'username', expectedMessage: 'username should be at least 5 characters'},
			{missingFieldName: 'password', expectedMessage: 'password should be at least 5 characters'},
			{missingFieldName: 'email', expectedMessage: 'invalid email'},
			{missingFieldName: 'email', expectedMessage: 'invalid email'}
		])(`return 400 whe $missingFieldName filed is missing`, async ({missingFieldName, expectedMessage}) => {
			const user = makeValidUserDetails();
			delete user[missingFieldName];
			const response = await request.post('/auth/signup', user);

			expect(response.status).toBe(400);
			expect(response.data.message).toBe(expectedMessage)
		})

		it('return 400 password 길이 5 이하이면', async () =>{
			const user = {
				...makeValidUserDetails(),
				password: 123
			};

			const response = await request.post('/auth/signup', user);
			expect(response.status).toBe(400);

			expect(response.data.message).toBe(`password should be at least 5 characters`)
		});

	});
	
	describe('POST to /auth/login', ()=>{
		it('return 200 정상로그인', async () =>{
			const user = await createNewUser();
			
			const response = await request.post('/auth/login', {
				username: user.username,
				password: user.password,
			});

			expect(response.status).toBe(200);
			expect(response.data.token.length).toBeGreaterThan(0)
		});

		it('return 401 없는 userName', async () =>{
			const randomUser = faker.random.alpha({count: 32})
			
			const response = await request.post('/auth/login', {
				username: randomUser,
				password: faker.internet.password(10, true) ,
			});

			expect(response.status).toBe(401);
			expect(response.data.message).toBe('Invalid user or password')
		});

		it('return 401 없는 password', async () =>{
			const user = await createNewUser();
			
			const response = await request.post('/auth/login', {
				username: user.username,
				password: faker.internet.password(10, true) ,
			});

			expect(response.status).toBe(401);
			expect(response.data.message).toBe('Invalid user or password')
		});

		describe('GET to /auth/me', ()=>{
			it('return 200 유효한 토큰이 있는경우 사용자 정보 전달 ', async () =>{
				const user = await createNewUser();
				
				const response = await request.get('/auth/me', {
					headers: {Authorization: `Bearer ${user.jwt}`},
				});
	
				expect(response.status).toBe(200);
				expect(response.data).toMatchObject({
					username: user.username,
					token: user.jwt
				});
			});
		});

	});

	async function createNewUser() {
		const createUser = makeValidUserDetails();
		const res = await request.post('/auth/signup', createUser);
		return {
			...createUser,
			jwt: res.data.token,
		}
	};

});


function makeValidUserDetails() {
	const fakerUser = faker.helpers.userCard();
	return { 
		name: fakerUser.name, 
		username: fakerUser.username, 
		email: fakerUser.email, 
		password: faker.internet.password(10, true) 
	};
}
