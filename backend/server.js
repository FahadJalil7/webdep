const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());


const users = [
    {
        id: 1,
        email: 'admin@kognitive.com',
        password: 'admin', // In a real app, use encryption!
        role: 'admin',
        name: 'Admin User',
        kogbucks_balance: 1000
    },
    {
        id: 2,
        email: 'user@kognitive.com',
        password: 'user', // In a real app, use encryption!
        role: 'user',
        name: 'Sales Rep',
        kogbucks_balance: 250
    }
];


app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        // Return user info (excluding password)
        const { password, ...userWithoutPassword } = user;
        res.json({ success: true, user: userWithoutPassword });
    } else {
        res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
});

// Get all users (admin only)
app.get('/api/users', (req, res) => {
    // Return users without passwords
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);
    res.json({ success: true, users: usersWithoutPasswords });
});

// Update user's kogbucks balance (admin only)
app.put('/api/users/:id/kogbucks', (req, res) => {
    const userId = parseInt(req.params.id);
    const { kogbucks_balance } = req.body;

    const user = users.find(u => u.id === userId);

    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (typeof kogbucks_balance !== 'number' || kogbucks_balance < 0) {
        return res.status(400).json({ success: false, message: 'Invalid kogbucks balance' });
    }

    user.kogbucks_balance = kogbucks_balance;

    const { password, ...userWithoutPassword } = user;
    res.json({ success: true, user: userWithoutPassword, message: 'Kogbucks balance updated successfully' });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
