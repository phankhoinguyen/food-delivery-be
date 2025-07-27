const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

const { databaseService } = require('../config/db');

exports.login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const db = databaseService.getDb();
        const userQuery = await db.collection('users').where('username', '==', username).get();
        if (userQuery.empty) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        const userDoc = userQuery.docs[0];
        const user = userDoc.data();
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        const token = jwt.sign({ userId: userDoc.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { username: user.username, role: user.role } });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Optional: Register API for testing
exports.register = async (req, res) => {
    const { username, password } = req.body;
    try {
        const db = databaseService.getDb();
        const userQuery = await db.collection('users').where('username', '==', username).get();
        if (!userQuery.empty) {
            return res.status(400).json({ message: 'Username already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            username,
            password: hashedPassword,
            role: 'user'
        };
        const userRef = await db.collection('users').add(newUser);
        res.status(201).json({ message: 'User registered successfully', userId: userRef.id });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server error' });
    }
};
