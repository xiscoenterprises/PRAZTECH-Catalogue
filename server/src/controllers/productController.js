const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const slugify = require('slugify');
const Product = require('../models/Product');
const { getDBStatus } = require('../config/db');

const localProductsFile = path.join(__dirname, '../../data/products.json');
const clientProductsFile = path.resolve(__dirname, '../../../client/src/data/products.json');
const clientImagesDir = path.resolve(__dirname, '../../../client/public/images/products');
const rootImagesDir = path.resolve(__dirname, '../../../product_images');

// Ensure directories exist safely (non-blocking for read-only serverless filesystems)
[clientImagesDir, rootImagesDir].forEach(dir => {
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  } catch (err) {
    // Gracefully ignore in read-only serverless environments like Vercel
  }
});

const ALLOWED_IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

// Configure secure disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, clientImagesDir);
  },
  filename: (req, file, cb) => {
    const rawExt = path.extname(file.originalname).toLowerCase();
    const safeExt = ALLOWED_IMAGE_EXTS.has(rawExt) ? rawExt : '.jpg';
    const base = path.basename(file.originalname, rawExt);
    const cleanName = slugify(base, { lower: true, strict: true }).slice(0, 30) || 'tooling';
    const randomHex = crypto.randomBytes(8).toString('hex');
    const safeFilename = `${cleanName}-${randomHex}${safeExt}`;
    cb(null, safeFilename);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Strict 5MB limit
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isExtValid = ALLOWED_IMAGE_EXTS.has(ext);
    const isMimeValid = ALLOWED_MIME_TYPES.has(file.mimetype);

    if (isExtValid && isMimeValid) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Only JPEG, PNG, or WebP images under 5MB are permitted.'));
    }
  }
});

/**
 * Middleware wrapper capturing multer errors cleanly
 */
const uploadMiddleware = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size exceeds 5MB limit. Please upload an image under 5MB.'
        });
      }
      return res.status(400).json({
        success: false,
        message: `Image upload error: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Invalid image file.'
      });
    }
    next();
  });
};

/**
 * Inspects binary magic numbers to ensure uploaded file is genuinely an authentic image
 */
const verifyImageMagicBytes = (filePath) => {
  try {
    const buffer = Buffer.alloc(16);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 16, 0);
    fs.closeSync(fd);

    // JPEG: FF D8 FF
    const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47 &&
                  buffer[4] === 0x0D && buffer[5] === 0x0A && buffer[6] === 0x1A && buffer[7] === 0x0A;

    // WebP: RIFF (bytes 0-3) and WEBP (bytes 8-11)
    const isWebp = buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
                   buffer.subarray(8, 12).toString('ascii') === 'WEBP';

    if (isJpeg || isPng || isWebp) return true;
    return false;
  } catch {
    return false;
  }
};

const loadLocalProducts = () => {
  if (fs.existsSync(localProductsFile)) {
    return JSON.parse(fs.readFileSync(localProductsFile, 'utf8'));
  }
  return [];
};

const syncLocalFiles = (products) => {
  const jsonStr = JSON.stringify(products, null, 2);
  try {
    fs.writeFileSync(localProductsFile, jsonStr, 'utf8');
  } catch (e) {
    console.warn('Could not write to localProductsFile:', e.message);
  }
  try {
    if (fs.existsSync(path.dirname(clientProductsFile))) {
      fs.writeFileSync(clientProductsFile, jsonStr, 'utf8');
    }
  } catch (e) {
    console.warn('Could not write to clientProductsFile:', e.message);
  }
};

// GET /api/products
const getProducts = async (req, res, next) => {
  try {
    const { category, search, sort = 'indexNumber', page = 1, limit = 50 } = req.query;

    if (getDBStatus()) {
      let query = { isActive: true };

      if (category) {
        query.categorySlug = category;
      }

      if (search && search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [
          { name: regex },
          { modelNo: regex },
          { description: regex },
          { compatibility: regex },
          { 'subModels.modelCode': regex }
        ];
      }

      const sortOption = {};
      if (sort === 'name') sortOption.name = 1;
      else if (sort === 'name_desc') sortOption.name = -1;
      else if (sort === 'model') sortOption.modelNo = 1;
      else sortOption.indexNumber = 1;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const total = await Product.countDocuments(query);
      const products = await Product.find(query).sort(sortOption).skip(skip).limit(parseInt(limit));
      const mappedProducts = products.map(p => {
        const obj = p.toObject();
        obj.id = obj.id || p._id?.toString() || p.slug;
        return obj;
      });

      return res.json({
        success: true,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        data: mappedProducts
      });
    }

    // Local JSON Fallback
    let items = loadLocalProducts().filter(p => p.isActive);

    if (category) {
      items = items.filter(p => p.categorySlug === category || p.category === category);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.modelNo && p.modelNo.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.compatibility && p.compatibility.toLowerCase().includes(q))
      );
    }

    if (sort === 'name') items.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'name_desc') items.sort((a, b) => b.name.localeCompare(a.name));
    else if (sort === 'model') items.sort((a, b) => a.modelNo.localeCompare(b.modelNo));
    else items.sort((a, b) => (a.indexNumber || 0) - (b.indexNumber || 0));

    const total = items.length;
    const paginated = items.slice((parseInt(page) - 1) * parseInt(limit), parseInt(page) * parseInt(limit));

    res.json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: paginated
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/:slug
const getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    if (getDBStatus()) {
      const product = await Product.findOne({ slug, isActive: true });
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      // Related products in the same category
      const related = await Product.find({
        categorySlug: product.categorySlug,
        slug: { $ne: product.slug },
        isActive: true
      }).limit(4);

      const prodObj = product.toObject();
      prodObj.id = prodObj.id || product._id?.toString() || product.slug;

      const mappedRelated = related.map(r => {
        const ro = r.toObject();
        ro.id = ro.id || r._id?.toString() || r.slug;
        return ro;
      });

      return res.json({ success: true, data: prodObj, relatedProducts: mappedRelated });
    }

    // Local Fallback
    const all = loadLocalProducts();
    const product = all.find(p => p.slug === slug);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const related = all.filter(p => p.categorySlug === product.categorySlug && p.slug !== product.slug).slice(0, 4);
    res.json({ success: true, data: product, relatedProducts: related });
  } catch (error) {
    next(error);
  }
};

// POST /api/products/compare
const compareProducts = async (req, res, next) => {
  try {
    const { slugs } = req.body;
    if (!Array.isArray(slugs) || slugs.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of product slugs to compare (max 4).' });
    }

    const targetSlugs = slugs.slice(0, 4);

    if (getDBStatus()) {
      const products = await Product.find({ slug: { $in: targetSlugs }, isActive: true });
      return res.json({ success: true, data: products });
    }

    const all = loadLocalProducts();
    const products = all.filter(p => targetSlugs.includes(p.slug));
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

// POST /api/products - Create a new product listing
const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      modelNo,
      category,
      categorySlug,
      cataloguePage,
      tag = 'standard',
      description = '',
      keyFeatures = [],
      applications = [],
      setIncludes = [],
      sizesDetail = [],
      compatibility = '',
      subModels = [],
      images = [],
      variantOptionNames = []
    } = req.body;

    if (!name || !modelNo || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name, Model No (SKU), and Category are mandatory fields.'
      });
    }

    // Generate unique slug
    const baseSlug = slugify(modelNo, { lower: true, strict: true }) || slugify(name, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    // Check slug collision
    const existingLocal = loadLocalProducts();
    while (existingLocal.some(p => p.slug === slug)) {
      slug = `${baseSlug}-${counter++}`;
    }

    const calculatedCategorySlug = categorySlug || slugify(category, { lower: true, strict: true });
    const maxIndex = existingLocal.reduce((max, p) => Math.max(max, p.indexNumber || 0), 0);
    const indexNumber = maxIndex + 1;

    const newProductData = {
      id: `prod-${String(indexNumber).padStart(2, '0')}-${slug}`,
      indexNumber,
      modelNo: modelNo.trim().toUpperCase(),
      slug,
      name: name.trim(),
      category: category.trim(),
      categorySlug: calculatedCategorySlug,
      cataloguePage: Number(cataloguePage) || indexNumber,
      tag: tag || 'standard',
      description: description.trim(),
      keyFeatures: Array.isArray(keyFeatures) ? keyFeatures.filter(Boolean) : [],
      applications: Array.isArray(applications) ? applications.filter(Boolean) : [],
      setIncludes: Array.isArray(setIncludes) ? setIncludes.filter(Boolean) : [],
      sizesDetail: Array.isArray(sizesDetail) ? sizesDetail.filter(Boolean) : [],
      compatibility: compatibility.trim(),
      variantOptionNames: Array.isArray(variantOptionNames) ? variantOptionNames : [],
      subModels: Array.isArray(subModels) ? subModels : [],
      images: Array.isArray(images) && images.length > 0 ? images : ['/images/products/psh-vgkp-with-heavy-stand.jpg'],
      isActive: true,
      createdAt: new Date().toISOString()
    };

    let createdProduct = newProductData;

    // 1. Save to MongoDB Atlas
    if (getDBStatus()) {
      try {
        createdProduct = await Product.create(newProductData);
      } catch (dbErr) {
        console.error('Atlas product creation error:', dbErr.message);
      }
    }

    // 2. Sync to local JSON files (both server and client)
    const updatedAll = [...existingLocal, newProductData];
    syncLocalFiles(updatedAll);

    return res.status(201).json({
      success: true,
      message: 'Product listing created successfully!',
      data: createdProduct
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/products/:slug - Update product listing
const updateProduct = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const updates = req.body;

    let updatedProduct = null;

    if (getDBStatus()) {
      updatedProduct = await Product.findOneAndUpdate({ slug }, updates, { new: true });
    }

    // Sync to local JSON files
    const all = loadLocalProducts();
    const idx = all.findIndex(p => p.slug === slug);
    if (idx !== -1) {
      all[idx] = { ...all[idx], ...updates };
      syncLocalFiles(all);
      if (!updatedProduct) updatedProduct = all[idx];
    }

    if (!updatedProduct) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    return res.json({ success: true, message: 'Product updated successfully.', data: updatedProduct });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/products/:slug - Delete product listing
const deleteProduct = async (req, res, next) => {
  try {
    const { slug } = req.params;

    if (getDBStatus()) {
      await Product.findOneAndDelete({ slug });
    }

    // Sync to local JSON files
    const all = loadLocalProducts();
    const filtered = all.filter(p => p.slug !== slug);
    syncLocalFiles(filtered);

    return res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// POST /api/products/upload-image - Upload product image (Authenticated)
const uploadProductImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded.' });
    }

    const uploadedFilePath = req.file.path;

    // Validate binary magic numbers / signature
    const isAuthenticImage = verifyImageMagicBytes(uploadedFilePath);
    if (!isAuthenticImage) {
      try {
        if (fs.existsSync(uploadedFilePath)) fs.unlinkSync(uploadedFilePath);
      } catch {}
      return res.status(400).json({
        success: false,
        message: 'Invalid image file signature. Only authentic JPEG, PNG, or WebP images are permitted.'
      });
    }

    const filename = req.file.filename;
    const publicUrl = `/images/products/${filename}`;

    // Mirror copy to root product_images folder
    try {
      const targetFile = path.join(rootImagesDir, filename);
      fs.copyFileSync(uploadedFilePath, targetFile);
    } catch (copyErr) {
      console.warn('Could not mirror image to product_images:', copyErr.message);
    }

    return res.json({
      success: true,
      message: 'Product image uploaded successfully.',
      url: publicUrl,
      filename
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductBySlug,
  compareProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  uploadMiddleware,
  verifyImageMagicBytes
};
