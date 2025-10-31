# Wishlist API Documentation

## Overview
The Wishlist API provides endpoints for managing user wishlists, including adding items, removing individual items, and clearing the entire wishlist.

## Base URL
```
http://localhost:5000/api/wishlist
```

## Authentication
All endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### 1. Get User's Wishlist
**GET** `/api/wishlist`

Fetches all items in the authenticated user's wishlist.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "user_id": "507f1f77bcf86cd799439012",
      "product_id": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Product Name",
        "price": 99.99,
        "image": "product-image.jpg",
        "description": "Product description"
      },
      "quantity": 1,
      "added_at": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

### 2. Add Item to Wishlist
**POST** `/api/wishlist`

Adds a new item to the user's wishlist.

**Request Body:**
```json
{
  "product_id": "507f1f77bcf86cd799439013",
  "quantity": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Item added to wishlist successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "user_id": "507f1f77bcf86cd799439012",
    "product_id": "507f1f77bcf86cd799439013",
    "quantity": 1,
    "added_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3. Remove Individual Item (NEW)
**POST** `/api/wishlist/remove`

Removes a specific item from the user's wishlist by item ID.

**Request Body:**
```json
{
  "item_id": "507f1f77bcf86cd799439011"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "removed_item_id": "507f1f77bcf86cd799439011"
  },
  "message": "Item removed from wishlist successfully"
}
```

### 4. Remove Item by ID (Alternative)
**DELETE** `/api/wishlist/:itemId`

Removes a specific item from the user's wishlist using the item ID in the URL.

**Response:**
```json
{
  "success": true,
  "message": "Item removed from wishlist successfully"
}
```

### 5. Clear Entire Wishlist
**DELETE** `/api/wishlist`

Clears the entire wishlist. Requires explicit `clear_all: true` flag to prevent accidental clearing.

**Request Body:**
```json
{
  "clear_all": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Wishlist cleared successfully",
  "deleted_count": 5
}
```

**Error Response (without clear_all flag):**
```json
{
  "success": false,
  "message": "Use /remove endpoint to remove individual items, or set clear_all: true to clear all"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Item ID is required"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Not authorized, no token"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Wishlist item not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Error removing from wishlist",
  "error": "Error details"
}
```

## Data Models

### Wishlist Item Schema
```javascript
{
  user_id: ObjectId,      // Reference to User model
  product_id: ObjectId,   // Reference to Product model
  quantity: Number,        // Default: 1, Min: 1
  added_at: Date,         // When item was added
  createdAt: Date,        // Mongoose timestamp
  updatedAt: Date         // Mongoose timestamp
}
```

## Security Features

1. **Authentication Required**: All endpoints require valid JWT token
2. **User Isolation**: Users can only access their own wishlist items
3. **Accidental Prevention**: Clear all requires explicit `clear_all: true` flag
4. **Input Validation**: MongoDB ObjectId format validation
5. **Duplicate Prevention**: Unique compound index on `user_id + product_id`

## Usage Examples

### Frontend Service Function
```javascript
export const removeFromWishlist = async (itemId) => {
  try {
    const response = await fetch('/api/wishlist/remove', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ item_id: itemId })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to remove from wishlist: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Service: Remove wishlist error:', error);
    throw error;
  }
};
```

### Testing with cURL
```bash
# Remove item from wishlist
curl -X POST http://localhost:5000/api/wishlist/remove \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"item_id": "507f1f77bcf86cd799439011"}'

# Clear entire wishlist
curl -X DELETE http://localhost:5000/api/wishlist \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"clear_all": true}'
```

## Migration Notes

If you're upgrading from an older version:

1. **New Endpoint**: Use `POST /remove` for individual item removal
2. **Clear Protection**: DELETE endpoint now requires `clear_all: true`
3. **Quantity Field**: New `quantity` field added to wishlist items
4. **Added At**: New `added_at` timestamp field for better tracking

## Support

For issues or questions, check the server logs for detailed debug information. All endpoints include comprehensive logging for troubleshooting.
