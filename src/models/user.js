const BaseRepository = require("../utils/baseRepository");



class UserRepository extends BaseRepository {
    constructor() {
        super('user');
    }

    async findByUserId(userId) {
        return this.findById(userId);
    }

}

const userRepository = new UserRepository();

module.exports = {
    userRepository
};