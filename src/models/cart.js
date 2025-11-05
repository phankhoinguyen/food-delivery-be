const BaseRepository = require("../utils/baseRepository");



class CartRepository extends BaseRepository {
    constructor() {
        super('cart');
    }

    async deleteByUserId(userId) {
        return this.deleteById(userId);
    }

}

const cartRepository = new CartRepository();

module.exports = {
    cartRepository
};