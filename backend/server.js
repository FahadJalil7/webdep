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

// --- Auction Items API ---

// Helper to compute auction status
function getAuctionStatus(item) {
    const now = new Date();
    if (new Date(item.endTime) < now) return 'ended';
    if (new Date(item.startTime) > now) return 'upcoming';
    return 'active';
}

let auctionItems = [
    {
        id: 1,
        name: "Vintage Film Camera",
        description: "A pristine condition 1970s film camera. Perfect for collectors and enthusiasts.",
        value: 150.00,
        startingBid: 25.00,
        currentBid: 55.00,
        bids: [],
        type: "Physical",
        imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
        bidCount: 5,
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 2,
        name: "$50 Amazon Gift Card",
        description: "Digital code for Amazon US.",
        value: 50.00,
        startingBid: 10.00,
        currentBid: 20.00,
        bids: [],
        type: "Gift Card",
        imageUrl: "https://images.unsplash.com/photo-1512418490979-92798cec1380?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
        bidCount: 2,
        startTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString()
    },
    {
        id: 3,
        name: "Signed Basketball",
        description: "Basketball signed by the local team captain.",
        value: 200.00,
        startingBid: 40.00,
        currentBid: 80.00,
        bids: [],
        type: "Physical",
        imageUrl: "https://images.unsplash.com/photo-1519861531473-920026393112?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
        bidCount: 8,
        startTime: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
    }
];

// Get all auction items (with optional sorting)
app.get('/api/auction-items', (req, res) => {
    let items = auctionItems.map(item => ({ ...item, status: getAuctionStatus(item) }));
    const { sortBy } = req.query;

    if (sortBy === 'priceAsc') {
        items.sort((a, b) => a.currentBid - b.currentBid);
    } else if (sortBy === 'priceDesc') {
        items.sort((a, b) => b.currentBid - a.currentBid);
    } else if (sortBy === 'popularity') {
        items.sort((a, b) => b.bidCount - a.bidCount);
    }

    res.json({ success: true, items });
});

// Get single item
app.get('/api/auction-items/:id', (req, res) => {
    const item = auctionItems.find(i => i.id === parseInt(req.params.id));
    if (item) {
        res.json({ success: true, item: { ...item, status: getAuctionStatus(item) } });
    } else {
        res.status(404).json({ success: false, message: 'Item not found' });
    }
});

// Create new auction item
app.post('/api/auction-items', (req, res) => {
    const { name, description, value, type, imageUrl, startingBid, startTime, endTime } = req.body;

    const newItem = {
        id: Date.now(),
        name,
        description,
        value: parseFloat(value),
        startingBid: parseFloat(startingBid) || 0,
        currentBid: parseFloat(startingBid) || 0,
        bids: [],
        type,
        imageUrl: imageUrl || "https://via.placeholder.com/300?text=No+Image",
        bidCount: 0,
        startTime: startTime || new Date().toISOString(),
        endTime: endTime || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    auctionItems.push(newItem);
    res.json({ success: true, item: { ...newItem, status: getAuctionStatus(newItem) } });
});

// Place a bid
app.post('/api/auction-items/:id/bid', (req, res) => {
    const itemId = parseInt(req.params.id);
    const { amount, userId } = req.body;

    const item = auctionItems.find(i => i.id === itemId);
    if (!item) {
        return res.status(404).json({ success: false, message: 'Item not found' });
    }

    // Reject bids on ended auctions
    if (getAuctionStatus(item) === 'ended') {
        return res.status(400).json({ success: false, message: 'This auction has ended' });
    }

    if (getAuctionStatus(item) === 'upcoming') {
        return res.status(400).json({ success: false, message: 'This auction has not started yet' });
    }

    if (amount <= item.currentBid) {
        return res.status(400).json({ success: false, message: 'Bid must be higher than current bid' });
    }

    // Check if user is already the highest bidder on any other active item
    const activeAuction = auctionItems.find(i => 
        i.id !== itemId && 
        getAuctionStatus(i) === 'active' && 
        i.bids.length > 0 && 
        i.bids[i.bids.length - 1].userId === userId
    );

    if (activeAuction) {
        return res.status(400).json({ 
            success: false, 
            message: `You already have an active bid on "${activeAuction.name}". You can only bid on one item at a time.` 
        });
    }

    const user = users.find(u => u.id === userId);
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Handle existing high bid processing
    let refundAmount = 0;
    const previousHighBid = item.bids.length > 0 ? item.bids[item.bids.length - 1] : null;

    // Check if user is raising their own bid
    const isRaisingOwnBid = previousHighBid && previousHighBid.userId === userId;
    
    // Calculate total available funds (current balance + potential refund if raising own bid)
    let availableFunds = user.kogbucks_balance;
    if (isRaisingOwnBid) {
        availableFunds += previousHighBid.amount; 
    }

    if (amount > availableFunds) {
        return res.status(400).json({ success: false, message: 'Insufficient funds' });
    }

    // 1. DEDUCT from current user (Hold funds)
    if (isRaisingOwnBid) {
        // Refund previous bid first (logically)
        user.kogbucks_balance += previousHighBid.amount;
    }
    user.kogbucks_balance -= parseFloat(amount);


    // 2. REFUND previous bidder (if different user)
    if (previousHighBid && !isRaisingOwnBid) {
        const prevUser = users.find(u => u.id === previousHighBid.userId);
        if (prevUser) {
            prevUser.kogbucks_balance += previousHighBid.amount;
            console.log(`Refunded ${previousHighBid.amount} to user ${prevUser.id}`);
        }
    }

    item.currentBid = parseFloat(amount);
    item.bidCount++;
    item.bids.push({ userId, amount: parseFloat(amount), timestamp: new Date() });

    // Return the updated balance for the frontend
    res.json({ 
        success: true, 
        item: { ...item, status: getAuctionStatus(item) }, 
        message: 'Bid placed successfully',
        newBalance: user.kogbucks_balance
    });
});

// Update item (Edit)
app.put('/api/auction-items/:id', (req, res) => {
    const itemId = parseInt(req.params.id);
    const updates = req.body;

    const index = auctionItems.findIndex(i => i.id === itemId);
    if (index === -1) {
        return res.status(404).json({ success: false, message: 'Item not found' });
    }

    auctionItems[index] = { ...auctionItems[index], ...updates };
    res.json({ success: true, item: auctionItems[index] });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
