import { REDIS_URL } from './serverConfig.js';

export const redisOptions = {
  connection: {
    url: REDIS_URL,
  },
};

export const redisConfig = {
  url: REDIS_URL,
};
