# E-Commerce Backend API

A comprehensive NestJS backend API for an e-commerce platform with MongoDB, JWT authentication, and full CRUD operations.

## Features

- 🔐 **JWT Authentication** - Secure user authentication with access/refresh tokens
- 👤 **User Management** - Registration, login, password reset
- 🛍️ **Product Management** - Full CRUD operations with filtering and search
- 🛒 **Shopping Cart** - Add, update, remove items with stock validation
- ❤️ **Wishlist** - Save favorite products
- 📦 **Order Management** - Create orders, track status, order history
- 👨‍💼 **Admin Panel** - Role-based access control for admin operations
- 🔍 **Advanced Filtering** - Search products by category, price, features

## Tech Stack

- **Framework**: NestJS 11
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (Passport)
- **Validation**: class-validator, class-transformer
- **Password Hashing**: bcrypt

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (running locally or MongoDB Atlas)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   cd e-commerce-backend
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Configure environment variables**
   
   Copy `.env.example` to `.env` and update the values:
   ```bash
   cp .env.example .env
   ```

   Update the following variables in `.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/ecommerce
   JWT_ACCESS_SECRET=your-super-secret-jwt-access-key-change-this-in-production
   JWT_REFRESH_SECRET=your-super-secret-jwt-refresh-key-change-this-in-production
   JWT_ACCESS_EXPIRATION=15m
   JWT_REFRESH_EXPIRATION=7d
   PORT=3001
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start MongoDB**
   
   Make sure MongoDB is running:
   ```bash
   # macOS with Homebrew
   brew services start mongodb-community
   
   # Or run manually
   mongod
   ```

5. **Seed the database**
   ```bash
   npm run seed
   ```

   This will create:
   - 8 sample products
   - Admin user: `admin@ecommerce.com` / `admin123`
   - Test user: `user@ecommerce.com` / `user123`

6. **Start the development server**
   ```bash
   npm run start:dev
   ```

   The API will be available at `http://localhost:3001`

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login user | No |
| POST | `/auth/logout` | Logout user | Yes |
| POST | `/auth/refresh` | Refresh access token | No |
| POST | `/auth/forgot-password` | Request password reset | No |
| POST | `/auth/reset-password` | Reset password | No |
| GET | `/auth/me` | Get current user profile | Yes |

### Products

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/products` | Get all products (with filters) | No |
| GET | `/products/:id` | Get product by ID | No |
| GET | `/products/featured` | Get featured products | No |
| GET | `/products/new` | Get new products | No |
| GET | `/products/category/:category` | Get products by category | No |
| POST | `/products` | Create product | Admin |
| PATCH | `/products/:id` | Update product | Admin |
| DELETE | `/products/:id` | Delete product | Admin |

**Query Parameters for GET /products:**
- `category`: Filter by category (Chairs, Sofas, Tables, Beds, Storage)
- `isNew`: Filter new products (true/false)
- `isFeatured`: Filter featured products (true/false)
- `search`: Search in title, subtitle, description
- `minPrice`: Minimum price
- `maxPrice`: Maximum price

### Cart

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/cart` | Get user's cart | Yes |
| POST | `/cart/items` | Add item to cart | Yes |
| PATCH | `/cart/items/:productId` | Update item quantity | Yes |
| DELETE | `/cart/items/:productId` | Remove item from cart | Yes |
| DELETE | `/cart` | Clear cart | Yes |
| GET | `/cart/total` | Get cart total | Yes |

### Wishlist

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/wishlist` | Get user's wishlist | Yes |
| POST | `/wishlist/toggle` | Toggle product in wishlist | Yes |
| DELETE | `/wishlist/:productId` | Remove from wishlist | Yes |
| GET | `/wishlist/check/:productId` | Check if in wishlist | Yes |

### Orders

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/orders` | Create order from cart | Yes |
| GET | `/orders` | Get user's orders | Yes |
| GET | `/orders/:id` | Get order by ID | Yes |
| GET | `/orders/all` | Get all orders | Admin |
| PATCH | `/orders/:id/status` | Update order status | Admin |

## Request/Response Examples

### Register User
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Get Products with Filters
```bash
curl "http://localhost:3001/products?category=Chairs&minPrice=1000000&maxPrice=5000000"
```

### Add to Cart
```bash
curl -X POST http://localhost:3001/cart/items \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "PRODUCT_ID",
    "quantity": 2
  }'
```

### Create Order
```bash
curl -X POST http://localhost:3001/orders \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shippingAddress": {
      "firstName": "John",
      "lastName": "Doe",
      "country": "Indonesia",
      "streetAddress": "123 Main St",
      "city": "Jakarta",
      "province": "DKI Jakarta",
      "zipCode": "12345",
      "phone": "+62123456789",
      "email": "john@example.com"
    },
    "paymentMethod": "bank",
    "additionalInfo": "Please deliver in the morning"
  }'
```

## Database Schema

### User
- name: string
- email: string (unique)
- password: string (hashed)
- role: 'user' | 'admin'
- refreshToken: string
- resetPasswordToken: string
- resetPasswordExpires: Date

### Product
- title: string
- subtitle: string
- description: string
- price: number
- originalPrice: number
- discount: number
- category: 'Chairs' | 'Sofas' | 'Tables' | 'Beds' | 'Storage'
- stock: number
- image: string
- isNew: boolean
- isFeatured: boolean

### Cart
- user: ObjectId (ref: User)
- items: Array of { product, quantity, price }

### Wishlist
- user: ObjectId (ref: User)
- products: Array of ObjectId (ref: Product)

### Order
- user: ObjectId (ref: User)
- orderNumber: string (unique)
- items: Array of { product, title, price, quantity }
- shippingAddress: object
- additionalInfo: string
- paymentMethod: 'bank' | 'cod'
- subtotal: number
- shipping: number
- total: number
- status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

## Scripts

- `npm run start:dev` - Start development server with hot reload
- `npm run start:prod` - Start production server
- `npm run build` - Build the application
- `npm run seed` - Seed database with initial data
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run tests

## Project Structure

```
src/
├── auth/                 # Authentication module
│   ├── dto/             # Data transfer objects
│   ├── guards/          # Auth guards
│   ├── schemas/         # User schema
│   └── strategies/      # JWT strategy
├── products/            # Products module
│   ├── dto/
│   └── schemas/
├── cart/                # Shopping cart module
│   ├── dto/
│   └── schemas/
├── wishlist/            # Wishlist module
│   ├── dto/
│   └── schemas/
├── orders/              # Orders module
│   ├── dto/
│   └── schemas/
├── seeds/               # Database seeding
├── app.module.ts        # Root module
└── main.ts              # Application entry point
```

## Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Refresh token rotation
- Role-based access control (RBAC)
- Input validation with class-validator
- CORS configuration
- Environment variable protection

## Error Handling

The API uses standard HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the UNLICENSED License.
