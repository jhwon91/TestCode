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
			const fakerUser = faker.helpers.userCard();
			const user = { 
				name: fakerUser.name, 
				username: fakerUser.username, 
				email: fakerUser.email, 
				password: faker.internet.password(10, true) 
			};

			const response = await request.post('/auth/signup', user);

			expect(response.status).toBe(201);
			expect(response.data.token.length).toBeGreaterThan(0)
		})
	})
})