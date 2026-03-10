const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Serve static files from the frontend build
const frontendPath = path.join(__dirname, 'public');
app.use(express.static(frontendPath));


const users = [
    {
        id: 1,
        email: 'admin@kognitive.com',
        password: 'admin', // In a real app, use encryption!
        role: 'admin',
        name: 'Admin User',
        kogbucks_balance: 1000,
        kogbucks_on_hold: 0
    },
    {
        id: 2,
        email: 'user@kognitive.com',
        password: 'user', // In a real app, use encryption!
        role: 'user',
        name: 'Sales Rep',
        kogbucks_balance: 250,
        kogbucks_on_hold: 0
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

// --- Auction Events API ---

// Helper to compute auction status
function getAuctionStatus(auction) {
    const now = new Date();
    if (new Date(auction.endTime) < now) return 'ended';
    if (new Date(auction.startTime) > now) return 'upcoming';
    return 'active';
}

let auctions = [
    {
        id: 1,
        title: "Spring Collector's Auction",
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        finalized: false
    },
    {
        id: 2,
        title: "Weekend Quick Auction",
        startTime: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        finalized: true
    }
];

let items = [
    {
        id: 1,
        auctionId: 1,
        name: "Vintage Film Camera",
        description: "A pristine condition 1970s film camera. Perfect for collectors and enthusiasts.",
        value: 150.00,
        startingBid: 25.00,
        currentBid: 55.00,
        bids: [],
        type: "Physical",
        imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
        bidCount: 5,
    },
    {
        id: 2,
        auctionId: 1,
        name: "$50 Amazon Gift Card",
        description: "Digital code for Amazon US.",
        value: 50.00,
        startingBid: 10.00,
        currentBid: 20.00,
        bids: [],
        type: "Gift Card",
        imageUrl: "https://images.unsplash.com/photo-1512418490979-92798cec1380?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
        bidCount: 2,
    },
    {
        id: 3,
        auctionId: 2,
        name: "Signed Basketball",
        description: "Basketball signed by the local team captain.",
        value: 200.00,
        startingBid: 40.00,
        currentBid: 80.00,
        bids: [],
        type: "Physical",
        imageUrl: "https://images.unsplash.com/photo-1519861531473-920026393112?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
        bidCount: 8,
    }
];

// Get all auctions
app.get('/api/auctions', (req, res) => {
    let result = auctions.map(auction => {
        const auctionItems = items.filter(i => i.auctionId === auction.id);
        return { ...auction, status: getAuctionStatus(auction), items: auctionItems, itemCount: auctionItems.length };
    });

    res.json({ success: true, auctions: result });
});

// Get single auction
app.get('/api/auctions/:id', (req, res) => {
    const auction = auctions.find(a => a.id === parseInt(req.params.id));
    if (auction) {
        const auctionItems = items.filter(i => i.auctionId === auction.id);
        res.json({ success: true, auction: { ...auction, status: getAuctionStatus(auction), items: auctionItems } });
    } else {
        res.status(404).json({ success: false, message: 'Auction not found' });
    }
});

// Create new auction
app.post('/api/auctions', (req, res) => {
    const { title, startTime, endTime, items: newItems } = req.body;

    const newAuction = {
        id: Date.now(),
        title,
        startTime: startTime || new Date().toISOString(),
        endTime: endTime || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        finalized: false
    };
    auctions.push(newAuction);

    const createdItems = [];
    if (newItems && Array.isArray(newItems)) {
        newItems.forEach((item, index) => {
            const newItem = {
                id: Date.now() + index + 1,
                auctionId: newAuction.id,
                name: item.name,
                description: item.description,
                value: parseFloat(item.value),
                startingBid: parseFloat(item.startingBid) || 0,
                currentBid: parseFloat(item.startingBid) || 0,
                bids: [],
                type: item.type || "Physical",
                imageUrl: item.imageUrl || "https://via.placeholder.com/300?text=No+Image",
                bidCount: 0
            };
            items.push(newItem);
            createdItems.push(newItem);
        });
    }

    res.json({ success: true, auction: { ...newAuction, status: getAuctionStatus(newAuction), items: createdItems } });
});

// Place a bid on an item
app.post('/api/items/:id/bid', (req, res) => {
    const itemId = parseInt(req.params.id);
    const { userId } = req.body;

    const item = items.find(i => i.id === itemId);
    if (!item) {
        return res.status(404).json({ success: false, message: 'Item not found' });
    }
    
    const auction = auctions.find(a => a.id === item.auctionId);
    if (!auction) {
        return res.status(404).json({ success: false, message: 'Auction not found' });
    }

    const status = getAuctionStatus(auction);

    // Reject bids on ended auctions
    if (status === 'ended') {
        return res.status(400).json({ success: false, message: 'This auction has ended' });
    }

    if (status === 'upcoming') {
        return res.status(400).json({ success: false, message: 'This auction has not started yet' });
    }

    const user = users.find(u => u.id === userId);
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    const amount = user.kogbucks_balance - (user.kogbucks_on_hold || 0);

    if (amount <= 0) {
        return res.status(400).json({ success: false, message: 'You have no available Kogbucks to bid.' });
    }

    if (amount <= item.currentBid) {
        return res.status(400).json({ success: false, message: 'Your available Kogbucks balance must be higher than the current bid' });
    }

    // Check if user is already the highest bidder on any active item in any auction
    const activeItem = items.find(i => {
        const a = auctions.find(act => act.id === i.auctionId);
        return a && getAuctionStatus(a) === 'active' && i.bids.length > 0 && i.bids[i.bids.length - 1].userId === userId;
    });

    if (activeItem) {
        if (activeItem.id === item.id) {
            return res.status(400).json({
                success: false,
                message: `You are already the highest bidder on this item. You can only bid after you've been outbid.`
            });
        }
        return res.status(400).json({
            success: false,
            message: `You already have an active bid on "${activeItem.name}". You can only bid after you've been outbid.`
        });
    }

    const previousHighBid = item.bids.length > 0 ? item.bids[item.bids.length - 1] : null;

    user.kogbucks_on_hold = (user.kogbucks_on_hold || 0) + amount;

    if (previousHighBid) {
        const prevUser = users.find(u => u.id === previousHighBid.userId);
        if (prevUser) {
            prevUser.kogbucks_on_hold = (prevUser.kogbucks_on_hold || 0) - previousHighBid.amount;
        }
    }

    item.currentBid = amount;
    item.bidCount++;
    item.bids.push({ userId, amount: amount, timestamp: new Date() });

    res.json({
        success: true,
        item: item,
        message: 'Bid placed successfully. Funds are now on hold.',
        newBalance: user.kogbucks_balance,
        newOnHold: user.kogbucks_on_hold
    });
});

// Update auction (Edit) - mainly start/end time
app.put('/api/auctions/:id', (req, res) => {
    const auctionId = parseInt(req.params.id);
    const updates = req.body;

    const auction = auctions.find(a => a.id === auctionId);
    if (!auction) {
        return res.status(404).json({ success: false, message: 'Auction not found' });
    }

    if (updates.title) auction.title = updates.title;
    if (updates.startTime) auction.startTime = updates.startTime;
    if (updates.endTime) auction.endTime = updates.endTime;

    const auctionItems = items.filter(i => i.auctionId === auction.id);
    res.json({ success: true, auction: { ...auction, status: getAuctionStatus(auction), items: auctionItems } });
});

// Auction Finalization Job
setInterval(() => {
    auctions.forEach(auction => {
        if (!auction.finalized && getAuctionStatus(auction) === 'ended') {
            auction.finalized = true;
            console.log(`Finalizing auction: ${auction.title}`);

            const auctionItems = items.filter(i => i.auctionId === auction.id);
            auctionItems.forEach(item => {
                if (item.bids.length > 0) {
                    const winningBid = item.bids[item.bids.length - 1];
                    const winningUser = users.find(u => u.id === winningBid.userId);

                    if (winningUser) {
                        winningUser.kogbucks_balance -= winningBid.amount;
                        winningUser.kogbucks_on_hold -= winningBid.amount;
                        console.log(`Item sold! Deducted ${winningBid.amount} from user ${winningUser.id}`);
                    }
                }
            });
        }
    });
}, 5000);

// Return JSON 404 for any unmatched /api routes
app.use('/api', (req, res) => {
    res.status(404).json({ success: false, message: 'API Route Not Found' });
});

// Fallback for SPA routing - serve index.html for all non-API paths
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

