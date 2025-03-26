const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());
app.use(cors({
    origin: ["https://tst-frontend.onrender.com", "http://localhost:3000"],
    methods: ["GET", "POST"]
}));

app.post('/', (req, res) => {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    const origin = req.headers['origin'];
    const { bfg, rid, clientSessionId } = req.body;
    const data = {
        ip,
        userAgent,
        origin,
        bfg,
        rid,
        clientSessionId
    }
    console.log(data);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
