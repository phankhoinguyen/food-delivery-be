const productRepository = require("../models/productRepository");

// Tạo sản phẩm
exports.createProduct = async (data) => {
    return await productRepository.create(data);
};

// Cập nhật sản phẩm
exports.updateProduct = async (id, data) => {
    return await productRepository.update(id, data);
};

// Xóa sản phẩm
exports.deleteProduct = async (id) => {
    return await productRepository.delete(id);
};

// Lấy tất cả sản phẩm (chỉ 3 trường: id, name, category)
exports.getAllProducts = async () => {
    return await productRepository.getAll();
};

// Lấy sản phẩm theo id 
exports.getProductById = async (id) => {
    return await productRepository.getById(id);
};

// Lấy sản phẩm theo name (không cần chính xác tuyệt đối)
exports.getProductsByName = async (name) => {
    return await productRepository.getByName(name);
};

// Lấy sản phẩm theo category
exports.getProductsByCategory = async (category) => {
    return await productRepository.getByCategory(category);
};
