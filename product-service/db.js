const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Creates a local database file named products.db
const dbPath = path.resolve(__dirname, 'products.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Create table
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT,
      price REAL,
      stock INTEGER
    )
      `);

  // Clear existing items to avoid duplicates on restarts
  db.run(`DELETE FROM products`);

  // Insert mock data
  const stmt = db.prepare(`INSERT INTO products (id, name, price, stock) VALUES (?, ?, ?, ?)`);
  stmt.run("1", "Wireless Laptop", 999.99, 10);
  stmt.run("2", "Mechanical Keyboard", 129.50, 25);
  stmt.run("3", "Gaming Mouse", 79.99, 50);
  stmt.finalize();

  console.log("SQLite Database initialized with dummy products.");
});

module.exports = db;