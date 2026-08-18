import authService from '../services/authService.js';
import { successResponse, errorResponse } from '../utils/common/responseObjects.js';
import StatusCodes from 'http-status-codes';
import { verifyFirebaseIdToken } from '../config/firebaseAdmin.js';

export const createFirebaseSession = async (req, res) => {
  const { idToken, username, role, registration = false } = req.body || {};
  if (!idToken) {
    return res.status(StatusCodes.BAD_REQUEST).json(errorResponse('Firebase ID token is required'));
  }

  try {
    const decodedToken = await verifyFirebaseIdToken(idToken);
    if (!decodedToken.email) {
      return res.status(StatusCodes.FORBIDDEN).json(errorResponse('The Firebase account does not have an email address'));
    }

    if (!decodedToken.email_verified) {
      if (!registration) {
        return res.status(StatusCodes.FORBIDDEN).json(errorResponse('Verify your email address before signing in'));
      }

      await authService.registerWithFirebase({
        firebaseUid: decodedToken.uid,
        email: decodedToken.email,
        username,
        role,
      });
      return res.status(StatusCodes.ACCEPTED).json(successResponse(
        { requiresEmailVerification: true },
        'Account created. Verify your email address before signing in.'
      ));
    }

    const session = await authService.loginWithFirebase({
      firebaseUid: decodedToken.uid,
      email: decodedToken.email,
      username,
      role,
      allowGeneratedUsername: decodedToken.firebase?.sign_in_provider === 'google.com',
    });
    return res.status(StatusCodes.OK).json(successResponse(session, 'Firebase session verified'));
  } catch (err) {
    if (err.message.includes('not configured')) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(errorResponse(err.message));
    }
    if (err.message === 'Username already taken' || err.message.startsWith('Choose a username') || err.message.startsWith('An account already exists')) {
      return res.status(StatusCodes.BAD_REQUEST).json(errorResponse(err.message));
    }
    return res.status(StatusCodes.UNAUTHORIZED).json(errorResponse('Firebase authentication failed'));
  }
};

export const register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(errorResponse('Username, email, and password are required'));
    }
    const result = await authService.register({ username, email, password, role });
    return res.status(StatusCodes.CREATED).json(successResponse(result, 'Account created'));
  } catch (err) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(errorResponse(err.message));
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(errorResponse('Email and password are required'));
    }
    const result = await authService.login({ email, password });
    return res.status(StatusCodes.OK).json(successResponse(result, 'Login successful'));
  } catch (err) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json(errorResponse(err.message));
  }
};

export const getProfile = async (req, res) => {
  try {
    const profile = await authService.getProfile(req.user.id);
    return res.status(StatusCodes.OK).json(successResponse(profile));
  } catch (err) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json(errorResponse(err.message));
  }
};

export const updateProfile = async (req, res) => {
  const { username } = req.body || {};
  const normalizedUsername = typeof username === 'string'
    ? username.trim().replace(/\s+/g, ' ')
    : '';

  if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(normalizedUsername) || normalizedUsername.length < 2 || normalizedUsername.length > 50) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(errorResponse('Name must contain only letters and single spaces (2–50 characters)'));
  }

  try {
    const profile = await authService.updateUsername(req.user.id, normalizedUsername);
    return res.status(StatusCodes.OK).json(successResponse(profile, 'Profile updated'));
  } catch (err) {
    const status = err.message === 'Username already taken'
      ? StatusCodes.CONFLICT
      : StatusCodes.BAD_REQUEST;
    return res.status(status).json(errorResponse(err.message));
  }
};
