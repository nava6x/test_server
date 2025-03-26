const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: "https://tst-frontend.onrender.com"
}));

app.get('/', (req, res) => {
    res.send('launched');
    return console.log(req.headers);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
