// Import 255 products from Excel data
const mongoose = require('mongoose');
const Product = require('./src/models/product');
const Category = require('./src/models/category');
const Brand = require('./src/models/brand');
require('dotenv').config();

// Complete product data from the Excel
const productData = [
  // Electronics & Appliances
  { mainCategory: "Electronics", subcategory: "Smartphones", productName: "Smartphone" },
  { mainCategory: "Electronics", subcategory: "Smartphones", productName: "Feature Phone" },
  { mainCategory: "Electronics", subcategory: "Smartphones", productName: "Phone Case" },
  { mainCategory: "Electronics", subcategory: "Smartphones", productName: "Screen Protector" },
  { mainCategory: "Electronics", subcategory: "Smartphones", productName: "Power Bank" },
  { mainCategory: "Electronics", subcategory: "Smartphones", productName: "Charger" },
  { mainCategory: "Electronics", subcategory: "Smartphones", productName: "USB Cable" },
  
  { mainCategory: "Electronics", subcategory: "Laptops & Tablets", productName: "Laptop" },
  { mainCategory: "Electronics", subcategory: "Laptops & Tablets", productName: "Tablet" },
  { mainCategory: "Electronics", subcategory: "Laptops & Tablets", productName: "Laptop Bag" },
  { mainCategory: "Electronics", subcategory: "Laptops & Tablets", productName: "Keyboard" },
  { mainCategory: "Electronics", subcategory: "Laptops & Tablets", productName: "Mouse" },
  { mainCategory: "Electronics", subcategory: "Laptops & Tablets", productName: "External Hard Drive" },
  { mainCategory: "Electronics", subcategory: "Laptops & Tablets", productName: "USB Drive" },
  
  { mainCategory: "Electronics", subcategory: "Home Appliances", productName: "Refrigerator" },
  { mainCategory: "Electronics", subcategory: "Home Appliances", productName: "Washing Machine" },
  { mainCategory: "Electronics", subcategory: "Home Appliances", productName: "Air Conditioner" },
  { mainCategory: "Electronics", subcategory: "Home Appliances", productName: "Vacuum Cleaner" },
  { mainCategory: "Electronics", subcategory: "Home Appliances", productName: "Water Purifier" },
  { mainCategory: "Electronics", subcategory: "Home Appliances", productName: "Dishwasher" },
  { mainCategory: "Electronics", subcategory: "Home Appliances", productName: "Room Heater" },
  
  { mainCategory: "Electronics", subcategory: "Kitchen Appliances", productName: "Microwave Oven" },
  { mainCategory: "Electronics", subcategory: "Kitchen Appliances", productName: "Mixer Grinder" },
  { mainCategory: "Electronics", subcategory: "Kitchen Appliances", productName: "Coffee Maker" },
  { mainCategory: "Electronics", subcategory: "Kitchen Appliances", productName: "Air Fryer" },
  { mainCategory: "Electronics", subcategory: "Kitchen Appliances", productName: "Toaster" },
  { mainCategory: "Electronics", subcategory: "Kitchen Appliances", productName: "Rice Cooker" },
  { mainCategory: "Electronics", subcategory: "Kitchen Appliances", productName: "Electric Kettle" },
  
  { mainCategory: "Electronics", subcategory: "Cameras & Drones", productName: "DSLR Camera" },
  { mainCategory: "Electronics", subcategory: "Cameras & Drones", productName: "Mirrorless Camera" },
  { mainCategory: "Electronics", subcategory: "Cameras & Drones", productName: "Action Camera" },
  { mainCategory: "Electronics", subcategory: "Cameras & Drones", productName: "Drone" },
  { mainCategory: "Electronics", subcategory: "Cameras & Drones", productName: "Camera Lens" },
  { mainCategory: "Electronics", subcategory: "Cameras & Drones", productName: "Tripod" },
  
  { mainCategory: "Electronics", subcategory: "Wearables", productName: "Smartwatch" },
  { mainCategory: "Electronics", subcategory: "Wearables", productName: "Fitness Band" },
  { mainCategory: "Electronics", subcategory: "Wearables", productName: "Smart Glasses" },
  { mainCategory: "Electronics", subcategory: "Wearables", productName: "VR/AR Headset" },
  
  { mainCategory: "Electronics", subcategory: "Audio Devices", productName: "Bluetooth Speaker" },
  { mainCategory: "Electronics", subcategory: "Audio Devices", productName: "Wireless Earbuds" },
  { mainCategory: "Electronics", subcategory: "Audio Devices", productName: "Headphones" },
  { mainCategory: "Electronics", subcategory: "Audio Devices", productName: "Soundbar" },
  { mainCategory: "Electronics", subcategory: "Audio Devices", productName: "Home Theater System" },
  
  // Fashion & Lifestyle
  { mainCategory: "Fashion", subcategory: "Men's Clothing", productName: "T-Shirt" },
  { mainCategory: "Fashion", subcategory: "Men's Clothing", productName: "Shirt" },
  { mainCategory: "Fashion", subcategory: "Men's Clothing", productName: "Jeans" },
  { mainCategory: "Fashion", subcategory: "Men's Clothing", productName: "Trousers" },
  { mainCategory: "Fashion", subcategory: "Men's Clothing", productName: "Jacket" },
  { mainCategory: "Fashion", subcategory: "Men's Clothing", productName: "Suit" },
  { mainCategory: "Fashion", subcategory: "Men's Clothing", productName: "Kurta" },
  
  { mainCategory: "Fashion", subcategory: "Women's Clothing", productName: "Dress" },
  { mainCategory: "Fashion", subcategory: "Women's Clothing", productName: "Saree" },
  { mainCategory: "Fashion", subcategory: "Women's Clothing", productName: "Top" },
  { mainCategory: "Fashion", subcategory: "Women's Clothing", productName: "Kurti" },
  { mainCategory: "Fashion", subcategory: "Women's Clothing", productName: "Lehenga" },
  { mainCategory: "Fashion", subcategory: "Women's Clothing", productName: "Leggings" },
  { mainCategory: "Fashion", subcategory: "Women's Clothing", productName: "Skirt" },
  
  { mainCategory: "Fashion", subcategory: "Kids & Baby Wear", productName: "T-Shirt" },
  { mainCategory: "Fashion", subcategory: "Kids & Baby Wear", productName: "Frock" },
  { mainCategory: "Fashion", subcategory: "Kids & Baby Wear", productName: "Shorts" },
  { mainCategory: "Fashion", subcategory: "Kids & Baby Wear", productName: "Onesie" },
  { mainCategory: "Fashion", subcategory: "Kids & Baby Wear", productName: "School Uniform" },
  { mainCategory: "Fashion", subcategory: "Kids & Baby Wear", productName: "Sweater" },
  
  { mainCategory: "Fashion", subcategory: "Footwear", productName: "Sneakers" },
  { mainCategory: "Fashion", subcategory: "Footwear", productName: "Sandals" },
  { mainCategory: "Fashion", subcategory: "Footwear", productName: "Heels" },
  { mainCategory: "Fashion", subcategory: "Footwear", productName: "Boots" },
  { mainCategory: "Fashion", subcategory: "Footwear", productName: "Flip Flops" },
  { mainCategory: "Fashion", subcategory: "Footwear", productName: "Formal Shoes" },
  
  { mainCategory: "Fashion", subcategory: "Watches & Jewelry", productName: "Wrist Watch" },
  { mainCategory: "Fashion", subcategory: "Watches & Jewelry", productName: "Bracelet" },
  { mainCategory: "Fashion", subcategory: "Watches & Jewelry", productName: "Necklace" },
  { mainCategory: "Fashion", subcategory: "Watches & Jewelry", productName: "Earrings" },
  { mainCategory: "Fashion", subcategory: "Watches & Jewelry", productName: "Ring" },
  { mainCategory: "Fashion", subcategory: "Watches & Jewelry", productName: "Pendant" },
  
  { mainCategory: "Fashion", subcategory: "Bags & Accessories", productName: "Backpack" },
  { mainCategory: "Fashion", subcategory: "Bags & Accessories", productName: "Handbag" },
  { mainCategory: "Fashion", subcategory: "Bags & Accessories", productName: "Wallet" },
  { mainCategory: "Fashion", subcategory: "Bags & Accessories", productName: "Travel Bag" },
  { mainCategory: "Fashion", subcategory: "Bags & Accessories", productName: "Belt" },
  { mainCategory: "Fashion", subcategory: "Bags & Accessories", productName: "Cap" },
  { mainCategory: "Fashion", subcategory: "Bags & Accessories", productName: "Sunglasses" },
  
  // Home & Furniture
  { mainCategory: "Home", subcategory: "Furniture", productName: "Sofa" },
  { mainCategory: "Home", subcategory: "Furniture", productName: "Dining Table" },
  { mainCategory: "Home", subcategory: "Furniture", productName: "Bed" },
  { mainCategory: "Home", subcategory: "Furniture", productName: "Wardrobe" },
  { mainCategory: "Home", subcategory: "Furniture", productName: "Study Table" },
  { mainCategory: "Home", subcategory: "Furniture", productName: "Office Chair" },
  
  { mainCategory: "Home", subcategory: "Home Decor", productName: "Wall Clock" },
  { mainCategory: "Home", subcategory: "Home Decor", productName: "Lamp" },
  { mainCategory: "Home", subcategory: "Home Decor", productName: "Painting" },
  { mainCategory: "Home", subcategory: "Home Decor", productName: "Mirror" },
  { mainCategory: "Home", subcategory: "Home Decor", productName: "Vase" },
  { mainCategory: "Home", subcategory: "Home Decor", productName: "Curtains" },
  
  { mainCategory: "Home", subcategory: "Kitchen & Dining", productName: "Dinner Set" },
  { mainCategory: "Home", subcategory: "Kitchen & Dining", productName: "Cookware" },
  { mainCategory: "Home", subcategory: "Kitchen & Dining", productName: "Cutlery Set" },
  { mainCategory: "Home", subcategory: "Kitchen & Dining", productName: "Pressure Cooker" },
  { mainCategory: "Home", subcategory: "Kitchen & Dining", productName: "Mixer Bowl Set" },
  { mainCategory: "Home", subcategory: "Kitchen & Dining", productName: "Glass Set" },
  
  { mainCategory: "Home", subcategory: "Storage & Organization", productName: "Shoe Rack" },
  { mainCategory: "Home", subcategory: "Storage & Organization", productName: "Storage Box" },
  { mainCategory: "Home", subcategory: "Storage & Organization", productName: "Laundry Basket" },
  { mainCategory: "Home", subcategory: "Storage & Organization", productName: "Plastic Container" },
  { mainCategory: "Home", subcategory: "Storage & Organization", productName: "Drawer Organizer" },
  
  { mainCategory: "Home", subcategory: "Bedding & Mattresses", productName: "Bed Sheet" },
  { mainCategory: "Home", subcategory: "Bedding & Mattresses", productName: "Pillow" },
  { mainCategory: "Home", subcategory: "Bedding & Mattresses", productName: "Mattress" },
  { mainCategory: "Home", subcategory: "Bedding & Mattresses", productName: "Blanket" },
  { mainCategory: "Home", subcategory: "Bedding & Mattresses", productName: "Comforter" },
  { mainCategory: "Home", subcategory: "Bedding & Mattresses", productName: "Duvet Cover" },
  
  // Beauty & Personal Care
  { mainCategory: "Beauty", subcategory: "Skincare", productName: "Face Wash" },
  { mainCategory: "Beauty", subcategory: "Skincare", productName: "Moisturizer" },
  { mainCategory: "Beauty", subcategory: "Skincare", productName: "Sunscreen" },
  { mainCategory: "Beauty", subcategory: "Skincare", productName: "Serum" },
  { mainCategory: "Beauty", subcategory: "Skincare", productName: "Face Mask" },
  { mainCategory: "Beauty", subcategory: "Skincare", productName: "Toner" },
  
  { mainCategory: "Beauty", subcategory: "Hair Care", productName: "Shampoo" },
  { mainCategory: "Beauty", subcategory: "Hair Care", productName: "Conditioner" },
  { mainCategory: "Beauty", subcategory: "Hair Care", productName: "Hair Oil" },
  { mainCategory: "Beauty", subcategory: "Hair Care", productName: "Hair Serum" },
  { mainCategory: "Beauty", subcategory: "Hair Care", productName: "Hair Dryer" },
  
  { mainCategory: "Beauty", subcategory: "Fragrances", productName: "Perfume" },
  { mainCategory: "Beauty", subcategory: "Fragrances", productName: "Deodorant" },
  { mainCategory: "Beauty", subcategory: "Fragrances", productName: "Body Mist" },
  { mainCategory: "Beauty", subcategory: "Fragrances", productName: "Cologne" },
  
  { mainCategory: "Beauty", subcategory: "Personal Care Appliances", productName: "Hair Dryer" },
  { mainCategory: "Beauty", subcategory: "Personal Care Appliances", productName: "Hair Straightener" },
  { mainCategory: "Beauty", subcategory: "Personal Care Appliances", productName: "Epilator" },
  
  { mainCategory: "Beauty", subcategory: "Health & Wellness", productName: "Vitamin Supplements" },
  { mainCategory: "Beauty", subcategory: "Health & Wellness", productName: "Protein Powder" },
  { mainCategory: "Beauty", subcategory: "Health & Wellness", productName: "Massager" },
  { mainCategory: "Beauty", subcategory: "Health & Wellness", productName: "Yoga Mat" },
  
  // Groceries & Essentials
  { mainCategory: "Groceries", subcategory: "Food & Beverages", productName: "Dal" },
  { mainCategory: "Groceries", subcategory: "Food & Beverages", productName: "Juice" },
  { mainCategory: "Groceries", subcategory: "Food & Beverages", productName: "Tea" },
  { mainCategory: "Groceries", subcategory: "Food & Beverages", productName: "Coffee" },
  { mainCategory: "Groceries", subcategory: "Food & Beverages", productName: "Cereal" },
  { mainCategory: "Groceries", subcategory: "Food & Beverages", productName: "Sugar" },
  { mainCategory: "Groceries", subcategory: "Food & Beverages", productName: "Cooking Oil" },
  
  { mainCategory: "Groceries", subcategory: "Fresh Produce", productName: "Potato" },
  { mainCategory: "Groceries", subcategory: "Fresh Produce", productName: "Tomato" },
  { mainCategory: "Groceries", subcategory: "Fresh Produce", productName: "Onion" },
  { mainCategory: "Groceries", subcategory: "Fresh Produce", productName: "Carrot" },
  { mainCategory: "Groceries", subcategory: "Fresh Produce", productName: "Spinach" },
  { mainCategory: "Groceries", subcategory: "Fresh Produce", productName: "Okra" },
  
  { mainCategory: "Groceries", subcategory: "Snacks", productName: "Chips" },
  { mainCategory: "Groceries", subcategory: "Snacks", productName: "Noodles" },
  { mainCategory: "Groceries", subcategory: "Snacks", productName: "Chocolate" },
  { mainCategory: "Groceries", subcategory: "Snacks", productName: "Popcorn" },
  { mainCategory: "Groceries", subcategory: "Snacks", productName: "Dry Fruits" },
  
  { mainCategory: "Groceries", subcategory: "Household Supplies", productName: "Detergent Powder" },
  { mainCategory: "Groceries", subcategory: "Household Supplies", productName: "Dishwashing Liquid" },
  { mainCategory: "Groceries", subcategory: "Household Supplies", productName: "Toilet Cleaner" },
  { mainCategory: "Groceries", subcategory: "Household Supplies", productName: "Hand Wash" },
  { mainCategory: "Groceries", subcategory: "Household Supplies", productName: "Tissue Paper" },
  
  { mainCategory: "Groceries", subcategory: "Cleaning & Laundry", productName: "Floor Cleaner" },
  { mainCategory: "Groceries", subcategory: "Cleaning & Laundry", productName: "Laundry Liquid" },
  { mainCategory: "Groceries", subcategory: "Cleaning & Laundry", productName: "Mop" },
  { mainCategory: "Groceries", subcategory: "Cleaning & Laundry", productName: "Broom" },
  { mainCategory: "Groceries", subcategory: "Cleaning & Laundry", productName: "Scrub Brush" },
  
  // Sports & Outdoors
  { mainCategory: "Sports", subcategory: "Exercise Equipment", productName: "Treadmill" },
  { mainCategory: "Sports", subcategory: "Exercise Equipment", productName: "Dumbbell" },
  { mainCategory: "Sports", subcategory: "Exercise Equipment", productName: "Yoga Mat" },
  { mainCategory: "Sports", subcategory: "Exercise Equipment", productName: "Resistance Band" },
  { mainCategory: "Sports", subcategory: "Exercise Equipment", productName: "Exercise Bike" },
  { mainCategory: "Sports", subcategory: "Exercise Equipment", productName: "Skipping Rope" },
  
  { mainCategory: "Sports", subcategory: "Sports Gear", productName: "Football" },
  { mainCategory: "Sports", subcategory: "Sports Gear", productName: "Cricket Bat" },
  { mainCategory: "Sports", subcategory: "Sports Gear", productName: "Badminton Racket" },
  { mainCategory: "Sports", subcategory: "Sports Gear", productName: "Tennis Racket" },
  { mainCategory: "Sports", subcategory: "Sports Gear", productName: "Hockey Stick" },
  
  { mainCategory: "Sports", subcategory: "Outdoor Equipment", productName: "Tent" },
  { mainCategory: "Sports", subcategory: "Outdoor Equipment", productName: "Sleeping Bag" },
  { mainCategory: "Sports", subcategory: "Outdoor Equipment", productName: "Camping Stove" },
  { mainCategory: "Sports", subcategory: "Outdoor Equipment", productName: "Torch" },
  { mainCategory: "Sports", subcategory: "Outdoor Equipment", productName: "Hiking Backpack" },
  
  { mainCategory: "Sports", subcategory: "Bicycles & Accessories", productName: "Bicycle" },
  { mainCategory: "Sports", subcategory: "Bicycles & Accessories", productName: "Helmet" },
  { mainCategory: "Sports", subcategory: "Bicycles & Accessories", productName: "Cycling Gloves" },
  { mainCategory: "Sports", subcategory: "Bicycles & Accessories", productName: "Water Bottle Holder" },
  { mainCategory: "Sports", subcategory: "Bicycles & Accessories", productName: "Bicycle Lock" },
  
  // Toys, Baby & Kids
  { mainCategory: "Toys", subcategory: "Toys & Games", productName: "Puzzle" },
  { mainCategory: "Toys", subcategory: "Toys & Games", productName: "Action Figure" },
  { mainCategory: "Toys", subcategory: "Toys & Games", productName: "Doll" },
  { mainCategory: "Toys", subcategory: "Toys & Games", productName: "Board Game" },
  { mainCategory: "Toys", subcategory: "Toys & Games", productName: "Remote Control Car" },
  { mainCategory: "Toys", subcategory: "Toys & Games", productName: "Building Blocks" },
  
  { mainCategory: "Toys", subcategory: "Baby Care", productName: "Diapers" },
  { mainCategory: "Toys", subcategory: "Baby Care", productName: "Feeding Bottle" },
  { mainCategory: "Toys", subcategory: "Baby Care", productName: "Baby Wipes" },
  { mainCategory: "Toys", subcategory: "Baby Care", productName: "Baby Lotion" },
  
  { mainCategory: "Toys", subcategory: "School Supplies", productName: "School Bag" },
  { mainCategory: "Toys", subcategory: "School Supplies", productName: "Notebook" },
  { mainCategory: "Toys", subcategory: "School Supplies", productName: "Pencil Box" },
  { mainCategory: "Toys", subcategory: "School Supplies", productName: "Crayons" },
  { mainCategory: "Toys", subcategory: "School Supplies", productName: "Lunch Box" },
  
  { mainCategory: "Toys", subcategory: "Baby Furniture", productName: "Baby Crib" },
  { mainCategory: "Toys", subcategory: "Baby Furniture", productName: "Stroller" },
  { mainCategory: "Toys", subcategory: "Baby Furniture", productName: "High Chair" },
  { mainCategory: "Toys", subcategory: "Baby Furniture", productName: "Playpen" },
  
  // Automotive
  { mainCategory: "Automotive", subcategory: "Car Accessories", productName: "Seat Cover" },
  { mainCategory: "Automotive", subcategory: "Car Accessories", productName: "Car Vacuum Cleaner" },
  { mainCategory: "Automotive", subcategory: "Car Accessories", productName: "Car Charger" },
  { mainCategory: "Automotive", subcategory: "Car Accessories", productName: "Sunshade" },
  { mainCategory: "Automotive", subcategory: "Car Accessories", productName: "Dashboard Camera" },
  
  { mainCategory: "Automotive", subcategory: "Bike Accessories", productName: "Helmet" },
  { mainCategory: "Automotive", subcategory: "Bike Accessories", productName: "Gloves" },
  { mainCategory: "Automotive", subcategory: "Bike Accessories", productName: "Bike Cover" },
  { mainCategory: "Automotive", subcategory: "Bike Accessories", productName: "Phone Holder" },
  
  { mainCategory: "Automotive", subcategory: "Spare Parts & Tools", productName: "Car Battery" },
  { mainCategory: "Automotive", subcategory: "Spare Parts & Tools", productName: "Tyre Inflator" },
  { mainCategory: "Automotive", subcategory: "Spare Parts & Tools", productName: "Wrench Set" },
  { mainCategory: "Automotive", subcategory: "Spare Parts & Tools", productName: "Jack Stand" },
  
  { mainCategory: "Automotive", subcategory: "Oils & Lubricants", productName: "Engine Oil" },
  { mainCategory: "Automotive", subcategory: "Oils & Lubricants", productName: "Brake Oil" },
  { mainCategory: "Automotive", subcategory: "Oils & Lubricants", productName: "Coolant" },
  
  // Books & Entertainment
  { mainCategory: "Books", subcategory: "Books", productName: "Novel" },
  { mainCategory: "Books", subcategory: "Books", productName: "Textbook" },
  { mainCategory: "Books", subcategory: "Books", productName: "Comic" },
  { mainCategory: "Books", subcategory: "Books", productName: "Magazine" },
  { mainCategory: "Books", subcategory: "Books", productName: "Cookbook" },
  
  { mainCategory: "Books", subcategory: "Music & Instruments", productName: "Guitar" },
  { mainCategory: "Books", subcategory: "Music & Instruments", productName: "Keyboard" },
  { mainCategory: "Books", subcategory: "Music & Instruments", productName: "Drum Set" },
  { mainCategory: "Books", subcategory: "Music & Instruments", productName: "Violin" },
  { mainCategory: "Books", subcategory: "Music & Instruments", productName: "Microphone" },
  
  { mainCategory: "Books", subcategory: "Video Games", productName: "PlayStation Console" },
  { mainCategory: "Books", subcategory: "Video Games", productName: "Xbox Console" },
  { mainCategory: "Books", subcategory: "Video Games", productName: "Nintendo Switch" },
  { mainCategory: "Books", subcategory: "Video Games", productName: "PC Game (DVD)" },
  { mainCategory: "Books", subcategory: "Video Games", productName: "Game Controller" },
  
  // Others / Niche
  { mainCategory: "Others", subcategory: "Pet Supplies", productName: "Dog Food" },
  { mainCategory: "Others", subcategory: "Pet Supplies", productName: "Cat Toy" },
  { mainCategory: "Others", subcategory: "Pet Supplies", productName: "Bird Cage" },
  { mainCategory: "Others", subcategory: "Pet Supplies", productName: "Aquarium" },
  
  { mainCategory: "Others", subcategory: "Stationery", productName: "Pen" },
  { mainCategory: "Others", subcategory: "Stationery", productName: "Pencil" },
  { mainCategory: "Others", subcategory: "Stationery", productName: "Printer Paper" },
  { mainCategory: "Others", subcategory: "Stationery", productName: "Stapler" },
  { mainCategory: "Others", subcategory: "Stationery", productName: "Marker" },
  
  { mainCategory: "Others", subcategory: "Gardening", productName: "Plant Pot" },
  { mainCategory: "Others", subcategory: "Gardening", productName: "Garden Tools" },
  { mainCategory: "Others", subcategory: "Gardening", productName: "Fertilizer" },
  { mainCategory: "Others", subcategory: "Gardening", productName: "Watering Can" },
  { mainCategory: "Others", subcategory: "Gardening", productName: "Seeds Pack" },
  
  { mainCategory: "Others", subcategory: "Industrial Tools", productName: "Drill Machine" },
  { mainCategory: "Others", subcategory: "Industrial Tools", productName: "Wrench Set" },
  { mainCategory: "Others", subcategory: "Industrial Tools", productName: "Hammer" },
  { mainCategory: "Others", subcategory: "Industrial Tools", productName: "Screwdriver Kit" }
];

// Helper functions
function generateSlug(name) {
  const baseSlug = name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
  
  // Add timestamp to ensure uniqueness
  const timestamp = Date.now().toString().slice(-6);
  return `${baseSlug}-${timestamp}`;
}

function generateSKU(productName, index) {
  const prefix = productName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
  const timestamp = Date.now().toString().slice(-6);
  const indexStr = (index + 1).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${indexStr}`;
}

function generatePrice(category) {
  const priceRanges = {
    'Electronics': { min: 50, max: 2000 },
    'Fashion': { min: 10, max: 500 },
    'Home': { min: 20, max: 1000 },
    'Beauty': { min: 5, max: 200 },
    'Groceries': { min: 1, max: 50 },
    'Sports': { min: 15, max: 800 },
    'Toys': { min: 5, max: 300 },
    'Automotive': { min: 10, max: 500 },
    'Books': { min: 5, max: 100 },
    'Others': { min: 5, max: 200 }
  };
  
  const range = priceRanges[category] || { min: 10, max: 100 };
  return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
}

function generateStock() {
  return Math.floor(Math.random() * 200) + 10; // 10-210 stock
}

function generateDescription(productName, subcategory) {
  const descriptions = [
    `High-quality ${productName.toLowerCase()} perfect for your needs`,
    `Premium ${productName.toLowerCase()} with excellent features`,
    `Durable ${productName.toLowerCase()} for everyday use`,
    `Modern ${productName.toLowerCase()} with great value`,
    `Reliable ${productName.toLowerCase()} for all occasions`
  ];
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

function generateBrandName(productName, subcategory) {
  // Create consistent brand names based on subcategory
  const brandMap = {
    'Smartphones': 'TechPro Brand',
    'Laptops & Tablets': 'EliteTech Corp',
    'Home Appliances': 'HomePro Ltd',
    'Kitchen Appliances': 'KitchenMax Inc',
    'Cameras & Drones': 'PhotoElite Co',
    'Wearables': 'WearTech Solutions',
    'Audio Devices': 'SoundPro Works',
    'Men\'s Clothing': 'StyleMax Brand',
    'Women\'s Clothing': 'FashionElite Corp',
    'Kids & Baby Wear': 'LittleStyle Ltd',
    'Footwear': 'ShoePro Inc',
    'Watches & Jewelry': 'LuxuryTime Co',
    'Bags & Accessories': 'AccessoryPro Solutions',
    'Furniture': 'FurnitureMax Works',
    'Home Decor': 'DecorElite Brand',
    'Kitchen & Dining': 'DiningPro Corp',
    'Storage & Organization': 'OrganizeMax Ltd',
    'Bedding & Mattresses': 'SleepPro Inc',
    'Skincare': 'BeautyElite Co',
    'Hair Care': 'HairPro Solutions',
    'Fragrances': 'ScentMax Works',
    'Personal Care Appliances': 'CareElite Brand',
    'Health & Wellness': 'WellnessPro Corp',
    'Food & Beverages': 'FoodMax Ltd',
    'Fresh Produce': 'FreshElite Inc',
    'Snacks': 'SnackPro Co',
    'Household Supplies': 'HomeSupplies Solutions',
    'Cleaning & Laundry': 'CleanMax Works',
    'Exercise Equipment': 'FitnessElite Brand',
    'Sports Gear': 'SportsPro Corp',
    'Outdoor Equipment': 'OutdoorMax Ltd',
    'Bicycles & Accessories': 'BikeElite Inc',
    'Toys & Games': 'ToyPro Co',
    'Baby Care': 'BabyElite Solutions',
    'School Supplies': 'SchoolMax Works',
    'Baby Furniture': 'BabyFurniture Brand',
    'Car Accessories': 'AutoPro Corp',
    'Bike Accessories': 'BikeAccessory Ltd',
    'Spare Parts & Tools': 'ToolMax Inc',
    'Oils & Lubricants': 'LubePro Co',
    'Books': 'BookElite Solutions',
    'Music & Instruments': 'MusicPro Works',
    'Video Games': 'GameMax Brand',
    'Pet Supplies': 'PetElite Corp',
    'Stationery': 'StationeryPro Ltd',
    'Gardening': 'GardenMax Inc',
    'Industrial Tools': 'ToolElite Co'
  };
  
  return brandMap[subcategory] || 'Generic Brand';
}

async function importAllProducts() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🔄 Clearing existing data...');
    await Product.deleteMany({});
    await Category.deleteMany({});
    await Brand.deleteMany({});
    console.log('✅ Cleared existing data');

    // Create categories and brands maps
    const categoriesMap = new Map();
    const brandsMap = new Map();

    // Step 1: Create main categories
    console.log('🔄 Creating main categories...');
    const mainCategories = [...new Set(productData.map(p => p.mainCategory))];
    for (const categoryName of mainCategories) {
      let category = await Category.findOne({ name: categoryName });
      if (!category) {
        category = await Category.create({
          name: categoryName,
          slug: generateSlug(categoryName),
          description: `${categoryName} category with wide range of products`,
          status: true
        });
        console.log(`✅ Created main category: ${categoryName}`);
      } else {
        console.log(`✅ Found existing main category: ${categoryName}`);
      }
      categoriesMap.set(categoryName, category._id);
    }

    // Step 2: Create subcategories
    console.log('🔄 Creating subcategories...');
    const subcategories = [...new Set(productData.map(p => p.subcategory))];
    for (const subcategoryName of subcategories) {
      const mainCategory = productData.find(p => p.subcategory === subcategoryName)?.mainCategory;
      const parentId = categoriesMap.get(mainCategory);
      
      let subcategory = await Category.findOne({ name: subcategoryName });
      if (!subcategory) {
        subcategory = await Category.create({
          name: subcategoryName,
          slug: generateSlug(subcategoryName),
          description: `${subcategoryName} subcategory under ${mainCategory}`,
          parent_id: parentId,
          status: true
        });
        console.log(`✅ Created subcategory: ${subcategoryName}`);
      } else {
        console.log(`✅ Found existing subcategory: ${subcategoryName}`);
      }
      categoriesMap.set(subcategoryName, subcategory._id);
    }

    // Step 3: Create brands
    console.log('🔄 Creating brands...');
    const uniqueBrands = new Set();
    productData.forEach(product => {
      const brandName = generateBrandName(product.productName, product.subcategory);
      uniqueBrands.add(brandName);
    });

    for (const brandName of uniqueBrands) {
      let brand = await Brand.findOne({ name: brandName });
      if (!brand) {
        brand = await Brand.create({
          name: brandName,
          slug: generateSlug(brandName),
          description: `${brandName} - Quality products for your needs`,
          status: true
        });
        console.log(`✅ Created brand: ${brandName}`);
      } else {
        console.log(`✅ Found existing brand: ${brandName}`);
      }
      brandsMap.set(brandName, brand._id);
    }

    // Step 4: Create products
    console.log('🔄 Creating products...');
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < productData.length; i++) {
      try {
        const product = productData[i];
        const brandName = generateBrandName(product.productName, product.subcategory);
        
        // Ensure brand exists
        let brandId = brandsMap.get(brandName);
        if (!brandId) {
          console.log(`⚠️ Brand not found: ${brandName}, creating it...`);
          let brand = await Brand.findOne({ name: brandName });
          if (!brand) {
            brand = await Brand.create({
              name: brandName,
              slug: generateSlug(brandName),
              description: `${brandName} - Quality products for your needs`,
              status: true
            });
          }
          brandId = brand._id;
          brandsMap.set(brandName, brandId);
        }
        
        // Ensure category exists
        let categoryId = categoriesMap.get(product.subcategory);
        if (!categoryId) {
          console.log(`⚠️ Category not found: ${product.subcategory}, skipping product...`);
          errorCount++;
          continue;
        }
        
        const productDoc = await Product.create({
          name: product.productName,
          slug: generateSlug(product.productName),
          sku: generateSKU(product.productName, i),
          description: generateDescription(product.productName, product.subcategory),
          price: generatePrice(product.mainCategory),
          stock: generateStock(),
          status: true,
          featured_image: `/uploads/products/placeholder-${Math.floor(Math.random() * 10) + 1}.jpg`,
          category_id: categoryId,
          brand_id: brandId
        });

        successCount++;
        if (successCount % 50 === 0) {
          console.log(`✅ Created ${successCount} products...`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Error creating product ${i + 1}: ${error.message}`);
      }
    }

    console.log('\n🎉 Import completed!');
    console.log('📊 Summary:');
    console.log(`   - Main Categories: ${mainCategories.length}`);
    console.log(`   - Subcategories: ${subcategories.length}`);
    console.log(`   - Brands: ${uniqueBrands.size}`);
    console.log(`   - Products: ${successCount} created, ${errorCount} errors`);
    console.log(`   - Total processed: ${productData.length}`);

  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the import
importAllProducts();
