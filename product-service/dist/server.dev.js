"use strict";

var grpc = require('@grpc/grpc-js');

var protoLoader = require('@grpc/proto-loader');

var path = require('path');

var db = require('./db'); // Loads our database file
// Load the product.proto file


var PROTO_PATH = path.resolve(__dirname, '../protos/product.proto');
var packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
var productProto = grpc.loadPackageDefinition(packageDefinition).product; // Implement the GetProducts business logic

function getProducts(call, callback) {
  db.all("SELECT * FROM products", [], function (err, rows) {
    if (err) {
      return callback({
        code: grpc.status.INTERNAL,
        details: "Failed to retrieve products from database."
      });
    } // Match the repeated message layout expected in product.proto


    callback(null, {
      products: rows
    });
  });
} // Start the gRPC server


function main() {
  var server = new grpc.Server();
  server.addService(productProto.ProductService.service, {
    GetProducts: getProducts
  });
  var port = "0.0.0.0:50051";
  server.bindAsync(port, grpc.ServerCredentials.createInsecure(), function (err, boundPort) {
    if (err) {
      console.error("Failed to bind server: ".concat(err.message));
      return;
    }

    console.log("Product Service (gRPC) running on port 50051");
  });
}

main();
//# sourceMappingURL=server.dev.js.map
