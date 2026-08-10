class CrudRepository {
  create() {
    throw new Error('CrudRepository.create must be implemented by a PostgreSQL repository');
  }

  findById() {
    throw new Error('CrudRepository.findById must be implemented by a PostgreSQL repository');
  }

  deleteById() {
    throw new Error('CrudRepository.deleteById must be implemented by a PostgreSQL repository');
  }
}

export default CrudRepository;
