"use strict";

// Polyfill IndexedDB for a pure Node.js background environment
var _require = require('fake-indexeddb'),
    indexedDB = _require.indexedDB,
    IDBKeyRange = _require.IDBKeyRange;

global.indexedDB = indexedDB;
global.IDBKeyRange = IDBKeyRange;

var grpc = require('@grpc/grpc-js');

var protoLoader = require('@grpc/proto-loader');

var _require2 = require('rxdb'),
    createRxDatabase = _require2.createRxDatabase,
    addRxPlugin = _require2.addRxPlugin;

var _require3 = require('rxdb/plugins/dev-mode'),
    RxDBDevModePlugin = _require3.RxDBDevModePlugin;

var _require4 = require('rxdb/plugins/storage-dexie'),
    getRxStorageDexie = _require4.getRxStorageDexie;

var _require5 = require('rxdb/plugins/validate-ajv'),
    wrappedValidateAjvStorage = _require5.wrappedValidateAjvStorage;

var EventEmitter = require('events'); // Create a global shared event broker to replace Docker Kafka locally


if (!global.sharedEventBroker) {
  global.sharedEventBroker = new EventEmitter();
} // Enable Dev Mode to assist with development tracking


addRxPlugin(RxDBDevModePlugin);
var PROTO_PATH = "C:\\Users\\MSI\\Desktop\\projet_sca\\protos\\order.proto";
var packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
var orderProto = grpc.loadPackageDefinition(packageDefinition).order;
var db;

function initInfrastructure() {
  return regeneratorRuntime.async(function initInfrastructure$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return regeneratorRuntime.awrap(createRxDatabase({
            name: 'ordersdb',
            storage: wrappedValidateAjvStorage({
              storage: getRxStorageDexie()
            }),
            multiInstance: false
          }));

        case 2:
          db = _context.sent;
          _context.next = 5;
          return regeneratorRuntime.awrap(db.addCollections({
            orders: {
              schema: {
                title: 'order schema',
                version: 0,
                primaryKey: 'id',
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                    maxLength: 100
                  },
                  productId: {
                    type: 'string'
                  },
                  quantity: {
                    type: 'integer'
                  },
                  status: {
                    type: 'string'
                  }
                },
                required: ['id', 'productId', 'quantity', 'status']
              }
            }
          }));

        case 5:
          console.log("RxDB (NoSQL) Database initialized smoothly.");
          console.log("🚀 [LOCAL MODE] In-Memory Kafka Mock active and waiting for events.");

        case 7:
        case "end":
          return _context.stop();
      }
    }
  });
}

function createOrder(call, callback) {
  var _call$request, productId, quantity, orderId, orderData;

  return regeneratorRuntime.async(function createOrder$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          _call$request = call.request, productId = _call$request.productId, quantity = _call$request.quantity;
          orderId = "ORD_" + Date.now();
          orderData = {
            id: orderId,
            productId: productId,
            quantity: quantity,
            status: "PENDING"
          }; // Save order into RxDB NoSQL database

          _context2.next = 6;
          return regeneratorRuntime.awrap(db.orders.insert(orderData));

        case 6:
          console.log("Order ".concat(orderId, " saved locally to RxDB.")); // Broadcast the event over our mock broker immediately

          global.sharedEventBroker.emit('order-events', JSON.stringify({
            event: 'ORDER_CREATED',
            orderId: orderId,
            productId: productId,
            quantity: quantity
          }));
          console.log("[Mock Kafka] Event published to topic 'order-events' for ".concat(orderId));
          callback(null, {
            orderId: orderId,
            status: "CREATED"
          });
          _context2.next = 16;
          break;

        case 12:
          _context2.prev = 12;
          _context2.t0 = _context2["catch"](0);
          console.error(_context2.t0);
          callback({
            code: grpc.status.INTERNAL,
            details: "Failed to create order."
          });

        case 16:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[0, 12]]);
}

function main() {
  var server;
  return regeneratorRuntime.async(function main$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.next = 2;
          return regeneratorRuntime.awrap(initInfrastructure());

        case 2:
          server = new grpc.Server();
          server.addService(orderProto.OrderService.service, {
            CreateOrder: createOrder
          });
          server.bindAsync("0.0.0.0:50052", grpc.ServerCredentials.createInsecure(), function (err, port) {
            if (err) return console.error("Failed to bind: ".concat(err.message));
            console.log("Order Service (gRPC) running on port 50052");
          });

        case 5:
        case "end":
          return _context3.stop();
      }
    }
  });
}

main()["catch"](console.error);
//# sourceMappingURL=server.dev.js.map
