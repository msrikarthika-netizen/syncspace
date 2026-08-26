import bcrypt from 'bcryptjs';
import userRepository from '../repositories/userRepository.js';
import { generateToken } from '../utils/common/authUtils.js';
import { ADMIN_EMAIL } from '../config/serverConfig.js';

class AuthService {
  isConfiguredAdmin(email) {
    return Boolean(
      ADMIN_EMAIL &&
      typeof email === 'string' &&
      email.trim().toLowerCase() === ADMIN_EMAIL
    );
  }

  async applyConfiguredAdminRole(user) {
    if (!user || !this.isConfiguredAdmin(user.email)) return user;

    // Do this during authentication as well as at startup. The account may
    // have been registered after the process started, or ADMIN_EMAIL may have
    // been added during a deploy.
    if (user.role !== 'admin' || user.isActive === false) {
      return userRepository.promoteAndActivateByEmail(user.email);
    }

    return user;
  }

  requestedRole(email, role) {
    // Only the email explicitly configured on the server can receive admin.
    // A role supplied by a browser can never grant this privilege.
    if (this.isConfiguredAdmin(email)) return 'admin';
    return role === 'manager' ? 'manager' : 'member';
  }

  toSession(user) {
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

  async register({ username, email, password, role }) {
    const existingEmail = await userRepository.findByEmail(email);
    if (existingEmail) throw new Error('Email already registered');

    const existingUsername = await userRepository.findByUsername(username);
    if (existingUsername) throw new Error('Username already taken');

    const passwordHash = await bcrypt.hash(password, 10);
    // Public registration can select a contributor or manager workspace role.
    // The server-configured bootstrap email is the sole exception.
    const requestedRole = this.requestedRole(email, role);
    const user = await userRepository.create({ username, email, passwordHash, role: requestedRole });
    return this.toSession(user);
  }

  async login({ email, password }) {
    let user = await userRepository.findByEmail(email);
    if (!user) throw new Error('Invalid email or password');
    user = await this.applyConfiguredAdminRole(user);
    if (user.isActive === false) throw new Error('This account has been suspended');

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) throw new Error('Invalid email or password');

    return this.toSession(user);
  }

  async loginWithFirebase({ firebaseUid, email, username, role, allowGeneratedUsername = false }) {
    let user = await userRepository.findByFirebaseUid(firebaseUid);

    // A pre-Firebase account can be safely linked to the same verified email.
    if (!user) {
      user = await userRepository.findByEmail(email);
      if (user) user = await userRepository.linkFirebaseUid(user._id, firebaseUid);
    }

    if (!user) {
      let requestedUsername = username?.trim();
      if (allowGeneratedUsername) {
        const base = (requestedUsername || email.split('@')[0] || 'member')
          .toLowerCase()
          .replace(/[^a-z0-9_]+/g, '_')
          .replace(/^_+|_+$/g, '')
          .slice(0, 72) || 'member';
        requestedUsername = base;
        if (await userRepository.findByUsername(requestedUsername)) {
          requestedUsername = `${base.slice(0, 72)}_${firebaseUid.slice(0, 7)}`;
        }
      } else {
        if (!requestedUsername || !/^[a-zA-Z0-9_]{3,80}$/.test(requestedUsername)) {
          throw new Error('Choose a username using 3–80 letters, numbers, or underscores.');
        }
        if (await userRepository.findByUsername(requestedUsername)) {
          throw new Error('Username already taken');
        }
      }

      const requestedRole = this.requestedRole(email, role);
      user = await userRepository.create({
        username: requestedUsername,
        email,
        role: requestedRole,
        firebaseUid,
      });
    }

    user = await this.applyConfiguredAdminRole(user);
    if (user.isActive === false) throw new Error('This account has been suspended');
    return this.toSession(user);
  }

  async registerWithFirebase({ firebaseUid, email, username, role }) {
    const existingFirebaseUser = await userRepository.findByFirebaseUid(firebaseUid);
    if (existingFirebaseUser) return existingFirebaseUser;

    // Never attach an unverified Firebase email to an existing local account.
    if (await userRepository.findByEmail(email)) {
      throw new Error('An account already exists for this email. Verify that account before signing in.');
    }

    const requestedUsername = username?.trim();
    if (!requestedUsername || !/^[a-zA-Z0-9_]{3,80}$/.test(requestedUsername)) {
      throw new Error('Choose a username using 3–80 letters, numbers, or underscores.');
    }
    if (await userRepository.findByUsername(requestedUsername)) {
      throw new Error('Username already taken');
    }

    return userRepository.create({
      username: requestedUsername,
      email,
      role: this.requestedRole(email, role),
      firebaseUid,
    });
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

  async updateUsername(userId, username) {
    const existingUsername = await userRepository.findByUsername(username);
    if (existingUsername && String(existingUsername._id) !== String(userId)) {
      throw new Error('Username already taken');
    }

    const user = await userRepository.updateUsername(userId, username);
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
