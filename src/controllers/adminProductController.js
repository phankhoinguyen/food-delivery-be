const adminProductService = require("../services/adminProductService");

// Tạo sản phẩm
const createProduct = async (req, res) => {
    try {
        const product = await adminProductService.createProduct(req.body);
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Cập nhật sản phẩm
const updateProduct = async (req, res) => {
    try {
        await adminProductService.updateProduct(req.params.id, req.body);
        // if (!product) return res.status(404).json({ message: "Product not found" });
        res.json({
            message: 'Updated Successful'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Xóa sản phẩm
const deleteProduct = async (req, res) => {
    try {
        const deleted = await adminProductService.deleteProduct(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Product not found" });
        res.json({ message: "Product deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Lấy tất cả sản phẩm (3 trường)
const getAllProducts = async (req, res) => {
    try {
        const products = await adminProductService.getAllProducts();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Lấy sản phẩm theo id (query param hoặc header)
const getProductById = async (req, res) => {
    const id = req.query.id || req.headers["id"];
    if (!id) return res.status(400).json({ message: "Missing product id" });

    try {
        const product = await adminProductService.getProductById(id);
        if (!product) return res.status(404).json({ message: "Product not found" });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Lấy sản phẩm theo name (substring, query param hoặc header)
const getProductsByName = async (req, res) => {
    const name = req.query.name || req.headers["name"];
    if (!name) return res.status(400).json({ message: "Missing product name" });

    try {
        const products = await adminProductService.getProductsByName(name);
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Lấy sản phẩm theo category (exact, query param hoặc header)
const getProductsByCategory = async (req, res) => {
    const category = req.query.category || req.headers["category"];
    if (!category) return res.status(400).json({ message: "Missing product category" });

    try {
        const products = await adminProductService.getProductsByCategory(category);
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createProduct,
    updateProduct,
    deleteProduct,
    getAllProducts,
    getProductById,
    getProductsByName,
    getProductsByCategory
};
