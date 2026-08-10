import bcrypt from 'bcryptjs';
import userRepository from '../repositories/userRepository.js';
import { generateToken } from '../utils/common/authUtils.js';

class AuthService {
  async register({ username, email, password, role }) {
    const existingEmail = await userRepository.findByEmail(email);
    if (existingEmail) throw new Error('Email already registered');

    const existingUsername = await userRepository.findByUsername(username);
    if (existingUsername) throw new Error('Username already taken');

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await userRepository.create({ username, email, passwordHash, role });
    const token = generateToken({ id: user._id, email: user.email, role: user.role });

    return {
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      },
    };
  }

  async login({ email, password }) {
    const user = await userRepository.findByEmail(email);
    if (!user) throw new Error('Invalid email or password');

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) throw new Error('Invalid email or password');

    const token = generateToken({ id: user._id, email: user.email, role: user.role });

    return {
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      },
    };
  }

  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error('User not found');
    return {
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}

export default new AuthService();
