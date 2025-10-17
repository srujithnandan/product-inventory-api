# Product Inventory API

A standalone Express.js API for managing product inventory using file-based storage.

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

The API will run on **http://localhost:3000**

## API Endpoints

- **GET** `/products` - Get all products
- **GET** `/products/instock` - Get in-stock products only
- **POST** `/products` - Create a new product
- **PUT** `/products/:id` - Update a product
- **DELETE** `/products/:id` - Delete a product

## Example Usage

### Get all products:
```bash
curl http://localhost:3000/products
```

### Create a product:
```bash
curl -X POST http://localhost:3000/products -H "Content-Type: application/json" -d "{\"name\":\"Keyboard\",\"price\":1500,\"inStock\":true}"
```

### Update a product:
```bash
curl -X PUT http://localhost:3000/products/1 -H "Content-Type: application/json" -d "{\"price\":55000}"
```

### Delete a product:
```bash
curl -X DELETE http://localhost:3000/products/2
```

## Features

✅ File-based storage (products.json)
✅ Auto-incrementing IDs
✅ Complete CRUD operations
✅ Input validation
✅ Error handling
✅ Bonus: In-stock filter endpoint
