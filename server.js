const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const PRODUCTS_FILE = path.join(__dirname, 'products.json');

// Middleware to enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Middleware to parse JSON
app.use(express.json());

// Serve static files (HTML, CSS, JS)
app.use(express.static(__dirname));

// Utility function to read products from file
const readProducts = () => {
  try {
    // Check if file exists
    if (!fs.existsSync(PRODUCTS_FILE)) {
      // Create file with empty array if it doesn't exist
      fs.writeFileSync(PRODUCTS_FILE, JSON.stringify([], null, 2));
      return [];
    }
    
    const data = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
    
    // Handle empty file
    if (!data.trim()) {
      return [];
    }
    
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading products file:', error.message);
    throw new Error('Failed to read products data');
  }
};

// Utility function to write products to file
const writeProducts = (products) => {
  try {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
  } catch (error) {
    console.error('Error writing products file:', error.message);
    throw new Error('Failed to save products data');
  }
};

// Validation middleware for product data
const validateProductData = (req, res, next) => {
  const { name, price, inStock } = req.body;
  
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ 
      error: 'Invalid input', 
      message: 'Product name is required and must be a non-empty string' 
    });
  }
  
  if (price === undefined || typeof price !== 'number' || price < 0) {
    return res.status(400).json({ 
      error: 'Invalid input', 
      message: 'Price is required and must be a non-negative number' 
    });
  }
  
  if (inStock === undefined || typeof inStock !== 'boolean') {
    return res.status(400).json({ 
      error: 'Invalid input', 
      message: 'inStock is required and must be a boolean value' 
    });
  }
  
  next();
};

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Product Inventory API',
    endpoints: {
      'GET /products': 'Get all products',
      'GET /products/instock': 'Get all in-stock products',
      'GET /products/:id': 'Get a specific product by ID',
      'POST /products': 'Create a new product',
      'PUT /products/:id': 'Update a product',
      'DELETE /products/:id': 'Delete a product'
    }
  });
});

// GET /products - Get all products
app.get('/products', (req, res) => {
  try {
    const products = readProducts();
    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Server error', 
      message: error.message 
    });
  }
});

// GET /products/instock - Get only in-stock products (BONUS)
app.get('/products/instock', (req, res) => {
  try {
    const products = readProducts();
    const inStockProducts = products.filter(product => product.inStock === true);
    
    res.json({
      success: true,
      count: inStockProducts.length,
      data: inStockProducts
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Server error', 
      message: error.message 
    });
  }
});

// GET /products/:id - Get a specific product by ID
app.get('/products/:id', (req, res) => {
  try {
    const products = readProducts();
    const productId = parseInt(req.params.id);
    
    if (isNaN(productId)) {
      return res.status(400).json({ 
        error: 'Invalid input', 
        message: 'Product ID must be a valid number' 
      });
    }
    
    const product = products.find(p => p.id === productId);
    
    if (!product) {
      return res.status(404).json({ 
        error: 'Not found', 
        message: `Product with ID ${productId} not found` 
      });
    }
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Server error', 
      message: error.message 
    });
  }
});

// POST /products - Create a new product
app.post('/products', validateProductData, (req, res) => {
  try {
    const products = readProducts();
    const { name, price, inStock } = req.body;
    
    // Generate new ID (auto-increment)
    const newId = products.length > 0 
      ? Math.max(...products.map(p => p.id)) + 1 
      : 1;
    
    const newProduct = {
      id: newId,
      name: name.trim(),
      price: price,
      inStock: inStock
    };
    
    products.push(newProduct);
    writeProducts(products);
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: newProduct
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Server error', 
      message: error.message 
    });
  }
});

// PUT /products/:id - Update an existing product
app.put('/products/:id', (req, res) => {
  try {
    const products = readProducts();
    const productId = parseInt(req.params.id);
    
    if (isNaN(productId)) {
      return res.status(400).json({ 
        error: 'Invalid input', 
        message: 'Product ID must be a valid number' 
      });
    }
    
    const productIndex = products.findIndex(p => p.id === productId);
    
    if (productIndex === -1) {
      return res.status(404).json({ 
        error: 'Not found', 
        message: `Product with ID ${productId} not found` 
      });
    }
    
    const { name, price, inStock } = req.body;
    
    // Validate updated fields
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ 
          error: 'Invalid input', 
          message: 'Product name must be a non-empty string' 
        });
      }
      products[productIndex].name = name.trim();
    }
    
    if (price !== undefined) {
      if (typeof price !== 'number' || price < 0) {
        return res.status(400).json({ 
          error: 'Invalid input', 
          message: 'Price must be a non-negative number' 
        });
      }
      products[productIndex].price = price;
    }
    
    if (inStock !== undefined) {
      if (typeof inStock !== 'boolean') {
        return res.status(400).json({ 
          error: 'Invalid input', 
          message: 'inStock must be a boolean value' 
        });
      }
      products[productIndex].inStock = inStock;
    }
    
    writeProducts(products);
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      data: products[productIndex]
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Server error', 
      message: error.message 
    });
  }
});

// DELETE /products/:id - Delete a product
app.delete('/products/:id', (req, res) => {
  try {
    const products = readProducts();
    const productId = parseInt(req.params.id);
    
    if (isNaN(productId)) {
      return res.status(400).json({ 
        error: 'Invalid input', 
        message: 'Product ID must be a valid number' 
      });
    }
    
    const productIndex = products.findIndex(p => p.id === productId);
    
    if (productIndex === -1) {
      return res.status(404).json({ 
        error: 'Not found', 
        message: `Product with ID ${productId} not found` 
      });
    }
    
    const deletedProduct = products[productIndex];
    products.splice(productIndex, 1);
    writeProducts(products);
    
    res.json({
      success: true,
      message: `Product with ID ${productId} deleted successfully`,
      data: deletedProduct
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Server error', 
      message: error.message 
    });
  }
});

// Handle 404 - Route not found
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found', 
    message: 'The requested endpoint does not exist' 
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Server error', 
    message: 'An unexpected error occurred' 
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Product Inventory API is running on http://localhost:${PORT}`);
  console.log(`📦 Products file: ${PRODUCTS_FILE}`);
  console.log('\nAvailable endpoints:');
  console.log('  GET    /products          - Get all products');
  console.log('  GET    /products/instock  - Get in-stock products');
  console.log('  GET    /products/:id      - Get product by ID');
  console.log('  POST   /products          - Create new product');
  console.log('  PUT    /products/:id      - Update product');
  console.log('  DELETE /products/:id      - Delete product');
});

module.exports = app;
