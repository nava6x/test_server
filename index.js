const express = require("express");
const session = require("express-session");
const RedisStore = require("connect-redis").default;
const { createClient } = require("redis");

const app = express();

// Create a Redis client
const redisClient = createClient({
  socket: {
    host: "127.0.0.1",  // Change if your Redis server is remote
    port: 6379
  }
});

redisClient.connect().catch(console.error);

// Set up session middleware with Redis store
app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: "your-secret-key",  // Replace with a strong secret
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,  // Set to true in production with HTTPS
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
