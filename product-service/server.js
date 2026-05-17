const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const db = require('./db'); // Loads our database file

// Load the product.proto file
const PROTO_PATH = path.resolve(__dirname, '../protos/product.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const productProto = grpc.loadPackageDefinition(packageDefinition).product;

// Implement the GetProducts business logic
function getProducts(call, callback) {
  db.all("SELECT * FROM products", [], (err, rows) => {
    if (err) {
      return callback({
        code: grpc.status.INTERNAL,
        details: "Failed to retrieve products from database."
      });
    }
    // Match the repeated message layout expected in product.proto
    callback(null, { products: rows });
  });
}

// Start the gRPC server
function main() {
  const server = new grpc.Server();
  server.addService(productProto.ProductService.service, { GetProducts: getProducts });
  
  const port = "0.0.0.0:50051";
  server.bindAsync(port, grpc.ServerCredentials.createInsecure(), (err, boundPort) => {
    if (err) {
      console.error(`Failed to bind server: ${err.message}`);
      return;
    }
    console.log(`Product Service (gRPC) running on port 50051`);
  });
}

main();