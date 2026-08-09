import { verifyToken } from '../utils/common/authUtils.js';
import { errorResponse } from '../utils/common/responseObjects.js';
import { INTERNAL_WEBHOOK_SECRET } from '../config/serverConfig.js';
import StatusCodes from 'http-status-codes';

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(StatusCodes.UNAUTHORIZED).json(errorResponse('No token provided'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch {
    return res.status(StatusCodes.UNAUTHORIZED).json(errorResponse('Invalid or expired token'));
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json(errorResponse('Insufficient permissions'));
    }
    next();
  };
};

export const authenticateInternal = (req, res, next) => {
  if (!INTERNAL_WEBHOOK_SECRET) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(errorResponse('Internal webhook secret is not configured'));
  }

  const providedSecret = req.headers['x-internal-secret'];
  if (providedSecret !== INTERNAL_WEBHOOK_SECRET) {
    return res.status(StatusCodes.UNAUTHORIZED).json(errorResponse('Invalid internal webhook secret'));
  }

  next();
};
