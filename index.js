require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const session = require('express-session');
const RedisStore = require('connect-redis')(session); // Using connect-redis version 6
const Redis = require('ioredis');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(express.json({ limit: '10kb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: ["http://localhost:3000", "https://tst-frontend.onrender.com"],
  credentials: true,
}));

// Redis client with production-ready configuration
const redisClient = new Redis({
  host: "redis-14293.c283.us-east-1-4.ec2.redns.redis-cloud.com",
  port: 14293,
  password: "ZG8Daep0vlfh0TCphdKxAYxSbaceV0iT",
  tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));

// Session configuration with additional security
app.use(
  session({
    store: new RedisStore({
      client: redisClient,
      ttl: 86400, // 1 day in seconds
      disableTouch: false,
    }),
    name: 'secureSessionId',
    secret: "d67cd6f9-a7a0-4c89-8a23-80292b47167ac0cd7793-c212-4f7b-b6c4-1b17037fce89",
    resave: false,
    saveUninitialized: false,
    rolling: true, // Reset maxAge on every request
    cookie: {
      httpsOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      domain: process.env.COOKIE_DOMAIN || undefined, // This is VERY important!
    },
  })
);


// Generate server salt from environment variable
const serverSalt = "94.215.112.204cd51:f5ac4df7c5-5063-45fa-9b46-d8779c92ce061711c453d:76fe:49zi9t7QrshU7T4gMjMPvsVOkq9WUgue9GkFTh7oo6";

// Enhanced verification function with additional validation
function generateVerificationId(ipAddress, userAgent, origin, bfg, rid, clientSessionId) {
  if (!ipAddress || !userAgent || !origin || !bfg || !rid || !clientSessionId) {
    throw new Error('Missing required parameters for verification ID generation');
  }

  const combinedString = `${ipAddress}:${userAgent}:${origin}:${bfg}:${rid}:${clientSessionId}:${serverSalt}`;
  return crypto.createHash('sha256').update(combinedString).digest('hex');
}

// Session endpoint with additional validation and security
app.post('/', async (req, res) => {
  try {
    // Validate required headers and body
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    const origin = req.headers['origin'];
    const { bfg, rid, clientSessionId } = req.body;

    if (!userAgent || !origin) {
      return res.status(400).json({ msg: 'Missing required headers' });
    }

    if (!bfg || !rid) {
      return res.status(400).json({ msg: 'Missing required body parameters' });
    }

    // New session creation
    if (!req.session.verificationId) {
      const newClientSessionId = crypto.randomBytes(20).toString('hex');
      const verificationId = generateVerificationId(
        ip,
        userAgent,
        origin,
        bfg,
        rid,
        newClientSessionId
      );

      // Store minimal required data in session
      req.session.verificationId = verificationId;
      req.session.clientSessionId = newClientSessionId;

      // Save session explicitly
      await new Promise((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      return res.status(201).json({
        msg: 'Session created',
        clientSessionId: newClientSessionId,
      });
    }

    // Existing session verification
    if (!clientSessionId) {
      return res.status(400).json({ msg: 'clientSessionId is required' });
    }

    const computedVerificationId = generateVerificationId(
      ip,
      userAgent,
      origin,
      bfg,
      rid,
      clientSessionId
    );

    if (computedVerificationId !== req.session.verificationId ||
      clientSessionId !== req.session.clientSessionId) {
      await new Promise((resolve) => {
        req.session.destroy(() => resolve());
      });
      return res.status(401).json({ msg: 'Session verification failed' });
    }

    // Update session timestamp
    req.session.touch();
    return res.status(200).json({ msg: 'Session verified' });

  } catch (error) {
    console.error('Session error:', error);
    return res.status(500).json({ msg: 'Internal Server Error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ msg: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
