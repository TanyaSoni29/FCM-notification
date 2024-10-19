/** @format */

// /** @format */

// const express = require('express');
// const mongoose = require('mongoose');
// const dotenv = require('dotenv');
// dotenv.config({ path: './.env' });
// const app = express();
// const User = require('./userModal');
// const cors = require('cors');
// const { Expo } = require('expo-server-sdk');

// let expo = new Expo();

// app.use(cors({ origin: '*' }));
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// const connectionString = process.env.MONGO_URI;

// mongoose
// 	.connect(connectionString)
// 	.then(() => {
// 		console.log('Connected to MongoDB');
// 	})
// 	.catch((err) => {
// 		console.log('Failed to connect to MongoDB', err);
// 	});

// app.post('/', async (req, res) => {
// 	const { userId, token } = req.body;
// 	console.log(userId, token);
// 	if (!token || !userId) {
// 		return res.status(400).json({
// 			data: null,
// 			error: 'Token and userid are required',
// 			status: 'errror',
// 		});
// 	}
// 	try {
// 		const user = await User.findOne({ userId: userId });
// 		if (user) {
// 			await User.updateOne(
// 				{ userId: userId },
// 				{ expoNotificationToken: token }
// 			);
// 		} else {
// 			const newUser = new User({
// 				userId: userId,
// 				expoNotificationToken: token,
// 			});
// 			await newUser.save();
// 		}
// 		res.status(200).json({
// 			data: token,
// 			status: 'success',
// 			error: null,
// 		});
// 	} catch (err) {
// 		res.status(500).json({
// 			data: null,
// 			error: 'Failed to register token',
// 			status: 'error',
// 		});
// 	}
// });

// app.get('/:id', async (req, res) => {
// 	const params = req.params.id;
// 	try {
// 		const user = await User.findOne({ userId: params });
// 		if (!user) {
// 			return res.status(404).json({
// 				data: null,
// 				error: 'User not found',
// 				status: 'error',
// 			});
// 		} else {
// 			res.status(200).json({
// 				data: user,
// 				error: null,
// 				status: 'success',
// 			});
// 		}
// 	} catch (err) {
// 		res.status(500).json({
// 			data: null,
// 			error: 'Failed to get user',
// 			status: 'error',
// 		});
// 	}
// });

// app.post('/send-notification', async (req, res) => {
// 	console.log('hello');
// 	const { to, title, body, data } = req.body;

// 	if (!to || !title || !body || !data) {
// 		res.status(400).json({
// 			data: null,
// 			error: 'Title, Body, Title, Data fields are required',
// 			status: 'error',
// 		});
// 	}

// 	if (!Expo.isExpoPushToken(to)) {
// 		console.error(`Push token ${to} is not a valid Expo push token`);
// 		return res.status(400).json({
// 			data: null,
// 			error: 'Invalid Expo push token',
// 			status: 'error',
// 		});
// 	}

// 	let messages = [
// 		{
// 			to,
// 			sound: 'default',
// 			title,
// 			body,
// 			data,
// 		},
// 	];

// 	try {
// 		let chunks = expo.chunkPushNotifications(messages);
// 		let tickets = [];

// 		for (let chunk of chunks) {
// 			try {
// 				let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
// 				console.log(ticketChunk);
// 				tickets.push(...ticketChunk);
// 			} catch (error) {
// 				console.error(error);
// 			}
// 		}

// 		res.json(tickets);
// 	} catch (error) {
// 		console.error('Error sending push notification:', error);
// 		res.status(500).send('❌ Failed to send notification');
// 	}
// });

// app.listen(process.env.PORT || 3000, () => {
// 	console.log('Server is running on port 3000');
// });

/** @format */

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const admin = require('firebase-admin');
dotenv.config({ path: './.env' });
const app = express();
const User = require('./userModal');
const cors = require('cors');

// Initialize Firebase Admin SDK
const serviceAccount = {
	type: process.env.FIREBASE_TYPE,
	project_id: process.env.FIREBASE_PROJECT_ID,
	private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
	private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
	client_email: process.env.FIREBASE_CLIENT_EMAIL,
	client_id: process.env.FIREBASE_CLIENT_ID,
	auth_uri: process.env.FIREBASE_AUTH_URI,
	token_uri: process.env.FIREBASE_TOKEN_URI,
	auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
	client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
};

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const connectionString = process.env.MONGO_URI;

mongoose
	.connect(connectionString)
	.then(() => {
		console.log('Connected to MongoDB');
	})
	.catch((err) => {
		console.log('Failed to connect to MongoDB', err);
	});

// Endpoint to register or update user FCM token
app.post('/', async (req, res) => {
	const { userId, token } = req.body;
	console.log(userId, token);
	if (!token || !userId) {
		return res.status(400).json({
			data: null,
			error: 'Token and userid are required',
			status: 'error',
		});
	}
	try {
		console.log(userId, token);
		const user = await User.findOne({ userId: userId });
		if (user) {
			await User.updateOne({ userId: userId }, { fcmToken: token });
		} else {
			const newUser = new User({
				userId: userId,
				fcmToken: token,
			});
			await newUser.save();
		}
		res.status(200).json({
			data: token,
			status: 'success',
			error: null,
		});
	} catch (err) {
		res.status(500).json({
			data: null,
			error: 'Failed to register token',
			status: 'error',
		});
	}
});

app.get('/', async (req, res) => {
	res.status(200).json({
		data: 'Server is running',
		status: 'success',
		error: null,
	});
});

// Endpoint to retrieve a user by ID
app.get('/:id', async (req, res) => {
	const params = req.params.id;
	try {
		const user = await User.findOne({ userId: params });
		if (!user) {
			return res.status(404).json({
				data: null,
				error: 'User not found',
				status: 'error',
			});
		} else {
			res.status(200).json({
				data: user,
				error: null,
				status: 'success',
			});
		}
	} catch (err) {
		res.status(500).json({
			data: null,
			error: 'Failed to get user',
			status: 'error',
		});
	}
});

// Endpoint to send a notification using Firebase Cloud Messaging
app.post('/send-notification', async (req, res) => {
	const { to, title, body, data } = req.body;

	if (!to || !title || !body) {
		return res.status(400).json({
			data: null,
			error: 'Title, Body, and Token are required',
			status: 'error',
		});
	}

	const message = {
		notification: {
			title: title,
			body: body,
		},
		data: data || {}, // Optional data payload
		token: to,
	};

	try {
		const response = await admin.messaging().send(message);
		console.log('Successfully sent message:', response);
		res.status(200).json({
			data: response,
			status: 'success',
			error: null,
		});
	} catch (error) {
		console.error('Error sending notification:', error);
		res.status(500).json({
			data: null,
			error: 'Failed to send notification',
			status: 'error',
		});
	}
});

app.listen(process.env.PORT || 3000, () => {
	console.log('Server is running on port 3000');
});
