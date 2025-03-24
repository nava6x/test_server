const express = require("express");
const session = require("express-session");
const RedisStore = require("connect-redis").default;
const { createClient } = require("redis");

const app = express();

// Use your Upstash Redis URL and Token
const redisClient = createClient({
  url: "",
  password: ""
});

redisClient.connect().catch(console.error);

// Set up session middleware with Redis store
app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: "your-secret-key", // Change to a strong secret
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
  })
);

app.get("/", (req, res) => {
  req.session.views = (req.session.views || 0) + 1;
  res.send(`Number of views: ${req.session.views}`);
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
