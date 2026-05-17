"use strict";

var sqlite3 = require('sqlite3').verbose();

var path = require('path'); // Creates a local database file named products.db


var dbPath = path.resolve(__dirname, 'products.db');
var db = new sqlite3.Database(dbPath);
db.serialize(function () {
  // Create table
  db.run("\n    CREATE TABLE IF NOT EXISTS products (\n      id TEXT PRIMARY KEY,\n      name TEXT,\n      price REAL,\n      stock INTEGER\n    )\n      "); // Clear existing items to avoid duplicates on restarts

  db.run("DELETE FROM products"); // Insert mock data

  var stmt = db.prepare("INSERT INTO products (id, name, price, stock) VALUES (?, ?, ?, ?)");
  stmt.run("1", "Wireless Laptop", 999.99, 10);
  stmt.run("2", "Mechanical Keyboard", 129.50, 25);
  stmt.run("3", "Gaming Mouse", 79.99, 50);
  stmt.finalize();
  console.log("SQLite Database initialized with dummy products.");
});
module.exports = db;
//# sourceMappingURL=db.dev.js.map
