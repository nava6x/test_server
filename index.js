const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: ["https://tst-frontend.onrender.com", "http://localhost:3000"],
    methods: ["GET", "POST"]
}));

app.post('/', (req, res) => {
    res.send('launched');
    return console.log(req);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
