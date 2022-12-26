import multer from "multer";
import Product from "../model/product/product.mongo.js";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // cb("null", "./uploads/");
  },
  filename: (req, file, cb) => {
    cb("null", new Date().toISOString + file.originalname); //file.filename
  },
});

const fileFilter = (req, file, cb) => {
  //   save a file
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png")
    cb("null", true);
  // reject file
  cb("null", false); //null OR "Unable to save file"
};
const upload = multer({
  storage,
  limits: { fieldSize: 1024 * 1024 },
  fileFilter,
});

const uploadImage = async (req, res) => {
  upload.array("images"); //images on mongoose use to post the images
  console.log(req.file);
  req.file();
};

// 1MB = 1024 * 1024
// 3MB = 1024 * 1024 * 3
// mimetype = "image/jpeg", "image.png"

// on product Controller
// images:req.file.path

// in app file
// app.use("/uploads", static("uploads"))