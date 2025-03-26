const express = require('express');
const cors = require('cors');
const app = express();

app.use(express.json())
app.use(cors({
  origin: "https://tst-frontend.onrender.com",
  methods: ["GET", "POST"]
}));

app.post('/test', (req, res) => {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.ip;
  const { 'user-agent': userAgent, origin } = req.headers;
  const body = req.body;
  
  const data = {
    ip,
    userAgent,
    origin,
    body
  }
  console.log(data)
  return res.status('201');
}); 

app.listen(5000, () => {
  console.log('Running');
}); 
