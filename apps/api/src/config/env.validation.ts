import Joi from 'joi';

/**
 * The app refuses to start with a missing or weak configuration rather than
 * failing later on the first request.
 */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(3000),
  MONGO_URI: Joi.string()
    .uri({ scheme: ['mongodb', 'mongodb+srv'] })
    .required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('1h'),
  CORS_ORIGIN: Joi.string().default('http://localhost:5173'),
  // HTTPS-only cookies unless told otherwise; only plain-http local setups turn this off.
  COOKIE_SECURE: Joi.boolean().default(process.env.NODE_ENV === 'production'),
  // Behind a reverse proxy (nginx in docker-compose) the client address comes from X-Forwarded-For;
  // without this every visitor shares the proxy's address and one rate limit.
  TRUST_PROXY: Joi.boolean().default(false),
  LOG_LEVEL: Joi.string().valid('fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent').default('info'),
});
