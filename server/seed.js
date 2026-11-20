import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MenuItem from './models/MenuItem.js';
import Table from './models/Table.js';
import User from './models/User.js';

dotenv.config();

const users = [
  {
    name: 'Sarah (Waiter)',
    email: 'waiter@restaurant.com',
    password: 'password123',
    role: 'waiter',
  },
  {
    name: 'Chef Marco',
    email: 'kitchen@restaurant.com',
    password: 'password123',
    role: 'kitchen',
  },
  {
    name: 'Alex Manager',
    email: 'admin@restaurant.com',
    password: 'password123',
    role: 'admin',
  },
];

// Realistic Rwandan Francs (RWF) Menu Pricing
const menuItems = [
  // Appetizers
  {
    name: 'Bruschetta',
    description: 'Toasted artisan bread topped with fresh tomatoes, basil, garlic, and extra virgin olive oil',
    price: 6000,
    category: 'appetizers',
    image: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400',
    preparationTime: 10,
  },
  {
    name: 'Calamari Fritti',
    description: 'Crispy fried calamari served with spiced tartar and house marinara dipping sauce',
    price: 9500,
    category: 'appetizers',
    image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400',
    preparationTime: 12,
  },
  {
    name: 'Caesar Salad',
    description: 'Fresh romaine lettuce, shaved parmesan, garlic croutons, and creamy Caesar dressing',
    price: 7500,
    category: 'appetizers',
    image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400',
    preparationTime: 8,
  },
  {
    name: 'Soup of the Day',
    description: 'Chef daily soup prepared fresh with local herbs, served with warm ciabatta roll',
    price: 5000,
    category: 'appetizers',
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400',
    preparationTime: 5,
  },
  // Mains
  {
    name: 'Grilled Ribeye Steak',
    description: 'Prime beef ribeye grilled with garlic rosemary butter, served with roasted vegetables',
    price: 28000,
    category: 'mains',
    image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400',
    preparationTime: 25,
  },
  {
    name: 'Pan-Seared Salmon',
    description: 'Fresh salmon fillet, lemon herb cream sauce, grilled asparagus, and steamed wild rice',
    price: 22000,
    category: 'mains',
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400',
    preparationTime: 20,
  },
  {
    name: 'Chicken Parmesan',
    description: 'Crispy golden chicken breast coated in marinara and melted mozzarella over pasta',
    price: 16500,
    category: 'mains',
    image: 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=400',
    preparationTime: 22,
  },
  {
    name: 'Mushroom Truffle Risotto',
    description: 'Creamy slow-cooked arborio rice with portobello mushrooms, parmesan, and truffle oil',
    price: 14000,
    category: 'mains',
    image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400',
    preparationTime: 25,
  },
  {
    name: 'Crispy Fish & Chips',
    description: 'Beer-battered fish fillets with hand-cut potato chips and tangy house tartar sauce',
    price: 12000,
    category: 'mains',
    image: 'https://images.unsplash.com/photo-1534766555764-ce878a5e3a2b?w=400',
    preparationTime: 18,
  },
  {
    name: 'Margherita Pizza',
    description: 'Fresh mozzarella cheese, aromatic basil, and Italian tomato sauce on thin crispy crust',
    price: 11000,
    category: 'mains',
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
    preparationTime: 15,
  },
  // Sides
  {
    name: 'Garlic Herb Bread',
    description: 'Toasted baguette with roasted garlic butter and fresh parsley',
    price: 4000,
    category: 'sides',
    image: 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=400',
    preparationTime: 8,
  },
  {
    name: 'Truffle Parmesan Fries',
    description: 'Golden crispy potato fries tossed with parmesan cheese and white truffle oil',
    price: 6500,
    category: 'sides',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400',
    preparationTime: 10,
  },
  {
    name: 'Sautéed Seasonal Veggies',
    description: 'Fresh market vegetables lightly sautéed in olive oil and aromatic herbs',
    price: 5000,
    category: 'sides',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400',
    preparationTime: 10,
  },
  // Desserts
  {
    name: 'Italian Tiramisu',
    description: 'Espresso-soaked ladyfingers layered with mascarpone cream and cocoa powder',
    price: 7000,
    category: 'desserts',
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400',
    preparationTime: 5,
  },
  {
    name: 'Warm Chocolate Lava Cake',
    description: 'Rich dark chocolate cake with molten center, served with vanilla ice cream',
    price: 8500,
    category: 'desserts',
    image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400',
    preparationTime: 15,
  },
  {
    name: 'Classic Crème Brûlée',
    description: 'Velvety vanilla custard topped with a brittle layer of caramelized sugar',
    price: 7500,
    category: 'desserts',
    image: 'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=400',
    preparationTime: 5,
  },
  // Beverages
  {
    name: 'Fresh Mint Lemonade',
    description: 'Freshly squeezed lemon juice with garden mint leaves and crushed ice',
    price: 3500,
    category: 'beverages',
    image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400',
    preparationTime: 3,
  },
  {
    name: 'Iced Hibiscus Tea',
    description: 'Refreshing brewed hibiscus herbal tea served chilled with lime slice',
    price: 2500,
    category: 'beverages',
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400',
    preparationTime: 2,
  },
  {
    name: 'Double Espresso (Rwandan Bourbon)',
    description: 'Double shot brewed from premium 100% Arabica Rwandan Bourbon beans',
    price: 2000,
    category: 'beverages',
    image: 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=400',
    preparationTime: 3,
  },
  {
    name: 'Sparkling Mineral Water',
    description: 'Chilled bottle of premium sparkling mineral water (500ml)',
    price: 2000,
    category: 'beverages',
    image: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400',
    preparationTime: 1,
  },
];

const tables = Array.from({ length: 15 }, (_, i) => ({
  number: i + 1,
  seats: i < 5 ? 2 : i < 10 ? 4 : 6,
  status: 'available',
}));

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant-order-system');
    console.log('Connected to MongoDB');

    await MenuItem.deleteMany({});
    await Table.deleteMany({});
    await User.deleteMany({});
    console.log('Cleared existing data');

    for (const u of users) {
      await User.create(u);
    }
    console.log(`Seeded ${users.length} users with RWF-ready roles`);

    await MenuItem.insertMany(menuItems);
    console.log(`Seeded ${menuItems.length} menu items with RWF currency values`);

    await Table.insertMany(tables);
    console.log(`Seeded ${tables.length} tables`);

    console.log('Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
