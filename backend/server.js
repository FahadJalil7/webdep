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
        name: 'Admin User'
    },
    {
        id: 2,
        email: 'user@kognitive.com',
        password: 'user', // In a real app, use encryption!
        role: 'user',
        name: 'Sales Rep'
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

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
