const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());
app.use(cors({
    origin: ["https://tst-frontend.onrender.com", "http://localhost:3000"],
    methods: ["GET", "POST"]
}));

app.get("/", (req, res) => {
    // Method 1: Using req.ip (built-in)
    const ip = req.ip;

    // Method 2: Checking headers for proxy support (if behind a reverse proxy)
    const forwardedIp = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    res.send(`Your IP Address is: ${forwardedIp || ip}`);
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
