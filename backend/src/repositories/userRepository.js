import CrudRepository from './crudRepository.js';
import User from '../models/User.js';

class UserRepository extends CrudRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email) {
    return await User.findOne({ email: email.toLowerCase() });
  }

  async findByUsername(username) {
    return await User.findOne({ username });
  }
}

export default new UserRepository();
