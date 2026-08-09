import authService from '../services/authService.js';
import { successResponse, errorResponse } from '../utils/common/responseObjects.js';
import StatusCodes from 'http-status-codes';

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
