require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
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
  origin: process.env.FRT_URL,
  credentials: true,
}));

// Redis client with production-ready configuration
const redisClient = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
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
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true, // Reset maxAge on every request
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      domain: process.env.COOKIE_DOMAIN || undefined,
    },
  })
);

// Validate required environment variables
const requiredEnvVars = ['FRT_URL', 'SESSION_SECRET', 'SERVER_SECRET'];
requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
});

// Generate server salt from environment variable
const serverSalt = process.env.SERVER_SECRET;

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
