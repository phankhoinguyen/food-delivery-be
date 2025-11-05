const BaseRepository = require("../utils/baseRepository");



class CartRepository extends BaseRepository {
    constructor() {
        super('cart');
    }

    async deleteById(userId) {
        return this.deleteById(userId);
    }

}

const cartRepository = new CartRepository();

module.exports = {
    cartRepository
};