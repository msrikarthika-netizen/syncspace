class CrudRepository {
  constructor(model) {
    this.model = model;
  }

  async create(data) {
    return await this.model.create(data);
  }

  async findById(id, populate = '') {
    return await this.model.findById(id).populate(populate);
  }

  async findOne(filter, populate = '') {
    return await this.model.findOne(filter).populate(populate);
  }

  async find(filter = {}, options = {}) {
    const { populate = '', sort = { createdAt: -1 }, limit = 50, skip = 0 } = options;
    return await this.model
      .find(filter)
      .populate(populate)
      .sort(sort)
      .limit(limit)
      .skip(skip);
  }

  async updateById(id, data, options = { returnDocument: 'after', runValidators: true }) {
    return await this.model.findByIdAndUpdate(id, data, options);
  }

  async updateOne(filter, data, options = { returnDocument: 'after' }) {
    return await this.model.findOneAndUpdate(filter, data, options);
  }

  async deleteById(id) {
    return await this.model.findByIdAndDelete(id);
  }

  async count(filter = {}) {
    return await this.model.countDocuments(filter);
  }
}

export default CrudRepository;
