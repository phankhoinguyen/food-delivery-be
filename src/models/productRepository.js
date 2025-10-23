const admin = require("firebase-admin");
const { v4: uuidv4 } = require("uuid");

// Initialize Firebase Admin nếu chưa init
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(), // hoặc serviceAccountKey
        storageBucket: "food-delivery-app-44c33.appspot.com",
    });
}

const db = admin.firestore();
const productsRef = db.collection("products");
const bucket = admin.storage().bucket();

// Hàm upload file lên Storage
async function uploadFileToStorage(file, folder = "product") {
    if (!file) return "";

    const filename = `${folder}/${uuidv4()}_${file.originalname}`;
    const fileUpload = bucket.file(filename);

    await fileUpload.save(file.buffer, {
        metadata: { contentType: file.mimetype },
        public: true, // public URL
    });

    return `https://storage.googleapis.com/${bucket.name}/${filename}`;
}

// Tạo sản phẩm
exports.create = async (data, fileCard, fileDetail) => {
    const docRef = productsRef.doc(); // ID tự sinh

    // Upload hình nếu có
    const imageCardUrl = await uploadFileToStorage(fileCard, "product");
    const imageDetailUrl = await uploadFileToStorage(fileDetail, "product");

    // Tạo object product
    const newProduct = {
        id: docRef.id,
        name: String(data.name || ''),
        category: String(data.category || ''),
        geoID: String(data.geoID || ''),
        geolink: String(data.geolink || ''),
        imageCard: imageCardUrl,
        imageDetail: imageDetailUrl,
        price: Number(data.price || 0),
        rate: Number(data.rate || 0),
        kcal: Number(data.kcal || 0),
        unit: String(data.unit || ''),
    };

    // Lưu Firestore
    await docRef.set(newProduct);

    const doc = await docRef.get();
    return { id: doc.id, ...doc.data() };
};
// Cập nhật sản phẩm
exports.update = async (id, data) => {
    const docRef = productsRef.doc(id);
    const fieldsToUpdate = {};
    if (data.name !== undefined) fieldsToUpdate.name = String(data.name);
    if (data.category !== undefined) fieldsToUpdate.category = String(data.category);
    if (data.geoID !== undefined) fieldsToUpdate.geoID = String(data.geoID);
    if (data.geolink !== undefined) fieldsToUpdate.geolink = String(data.geolink);
    if (data.imageCard !== undefined) fieldsToUpdate.imageCard = String(data.imageCard);
    if (data.imageDetail !== undefined) fieldsToUpdate.imageDetail = String(data.imageDetail);
    if (data.price !== undefined) fieldsToUpdate.price = Number(data.price);
    if (data.rate !== undefined) fieldsToUpdate.rate = Number(data.rate);
    if (data.kcal !== undefined) fieldsToUpdate.kcal = Number(data.kcal);
    if (data.unit !== undefined) fieldsToUpdate.unit = String(data.unit);

    if (Object.keys(fieldsToUpdate).length === 0) {
        throw new Error("Không có field nào để update");
    }

    await docRef.update(fieldsToUpdate);

};


// Xóa sản phẩm
exports.delete = async (id) => {
    const docRef = productsRef.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return null;
    await docRef.delete();
    return true;
};

// Lấy tất cả sản phẩm 
exports.getAll = async () => {
    const snapshot = await productsRef.get();
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: data.id,
            name: data.name,
            category: data.category,
            geoID: data.geoID,
            geolink: data.geolink,
            kcal: data.kcal,
            price: data.price,
            rate: data.rate,
            unit: data.unit,
            imageCard: data.imageCard,
            imageDetail: data.imageDetail
        };
    });
};

// Lấy sản phẩm theo id (hiện tất cả trường)
exports.getById = async (id) => {
    const docRef = productsRef.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
};

// Lấy sản phẩm theo name (substring, case-insensitive)
exports.getByName = async (name) => {
    const snapshot = await productsRef.get();
    const search = name.toLowerCase();
    return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(p => p.name.toLowerCase().includes(search));
};

// Lấy sản phẩm theo category (exact match, hiện tất cả trường)
exports.getByCategory = async (category) => {
    const snapshot = await productsRef.where("category", "==", category).get();
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            name: data.name,
            category: data.category,
            imageCard: data.imageCard,
            imageDetail: data.imageDetail
        };
    });
};