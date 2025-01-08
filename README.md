# Ecommerce API

This project is an Ecommerce API built with Node.js, Express, and MongoDB. It provides endpoints for managing products, users, orders, and authentication.

## Features

- User authentication and authorization
- CRUD operations for products
- Order management
- Secure password handling
- JWT-based authentication

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/Ecommerce-API.git
   ```
2. Navigate to the project directory:
   ```bash
   cd Ecommerce-API
   ```
3. Install dependencies:
   ```bash
   cd server
   npm install
   ```

## Configuration

1. Create a `.env` file in the server directory and add the environment variables in the :
   ```
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```

## Usage

1. Start the server:
   ```bash
   npm start
   ```
2. The API will be available at `http://localhost:5000`.

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user

### Products

- `GET /api/products` - Get all products
- `POST /api/products` - Create a new product
- `GET /api/products/:id` - Get a product by ID
- `PUT /api/products/:id` - Update a product by ID
- `DELETE /api/products/:id` - Delete a product by ID

### Orders

- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create a new order
- `GET /api/orders/:id` - Get an order by ID
- `PUT /api/orders/:id` - Update an order by ID
- `DELETE /api/orders/:id` - Delete an order by ID

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License.
