import Product from "./product.mongo.js";
import UnAuthorizedError from "../../errors/unauthorized.js";

export const productUser = async (productId) => {
  const findProduct = await Product.findById(productId);
  if (!findProduct) throw new notFoundError("Product not Found");

  // Match product to its user
  if (findProduct.user.toString() !== userId) {
    throw new UnAuthorizedError("Unauthorized User");
  }
};

export const addImage = async (file) => {
  if (file) {
    // Save image to cloudinary
    const uploadedFile = await cloudinary.uploader.upload(file.path, {
      folder: "Ecommerce API",
      resource_type: "image",
    });
    fileData = {
      id: uploadedFile.public_id,
      fileName: file.originalname,
      filePath: uploadedFile.secure_url,
      fileType: file.mimetype,
      fileSize: fileSizeFormatter(file.size, 2),
    };
  }
};
