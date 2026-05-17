// Polyfill IndexedDB for a pure Node.js background environment
const { indexedDB, IDBKeyRange } = require('fake-indexeddb');
global.indexedDB = indexedDB;
global.IDBKeyRange = IDBKeyRange;

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { createRxDatabase, addRxPlugin } = require('rxdb');
const { RxDBDevModePlugin } = require('rxdb/plugins/dev-mode');
const { getRxStorageDexie } = require('rxdb/plugins/storage-dexie');
const { wrappedValidateAjvStorage } = require('rxdb/plugins/validate-ajv');
const EventEmitter = require('events');

// Create a global shared event broker to replace Docker Kafka locally
if (!global.sharedEventBroker) {
  global.sharedEventBroker = new EventEmitter();
}

// Enable Dev Mode to assist with development tracking
addRxPlugin(RxDBDevModePlugin);

const PROTO_PATH = 'C:\\Users\\MSI\\Desktop\\projet_sca\\protos\\order.proto';
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true, longs: String, enums: String, defaults: true, oneofs: true
});
const orderProto = grpc.loadPackageDefinition(packageDefinition).order;

let db;

async function initInfrastructure() {
  db = await createRxDatabase({
    name: 'ordersdb',
    storage: wrappedValidateAjvStorage({ storage: getRxStorageDexie() }),
    multiInstance: false
  });

  await db.addCollections({
    orders: {
      schema: {
        title: 'order schema',
        version: 0,
        primaryKey: 'id',
        type: 'object',
        properties: {
          id: { type: 'string', maxLength: 100 },
          productId: { type: 'string' },
          quantity: { type: 'integer' },
          status: { type: 'string' }
        },
        required: ['id', 'productId', 'quantity', 'status']
      }
    }
  });
  console.log("RxDB (NoSQL) Database initialized smoothly.");
  console.log("🚀 [LOCAL MODE] In-Memory Kafka Mock active and waiting for events.");
}

async function createOrder(call, callback) {
  try {
    const { productId, quantity } = call.request;
    const orderId = "ORD_" + Date.now();
    const orderData = { id: orderId, productId, quantity, status: "PENDING" };

    // Save order into RxDB NoSQL database
    await db.orders.insert(orderData);
    console.log(`Order ${orderId} saved locally to RxDB.`);

    // Broadcast the event over our mock broker immediately
    global.sharedEventBroker.emit('order-events', JSON.stringify({
      event: 'ORDER_CREATED',
      orderId,
      productId,
      quantity
    }));
    console.log(`[Mock Kafka] Event published to topic 'order-events' for ${orderId}`);

    callback(null, { orderId: orderId, status: "CREATED" });
  } catch (error) {
    console.error(error);
    callback({ code: grpc.status.INTERNAL, details: "Failed to create order." });
  }
}

async function main() {
  await initInfrastructure();
  const server = new grpc.Server();
  server.addService(orderProto.OrderService.service, { CreateOrder: createOrder });
  
  server.bindAsync("0.0.0.0:50052", grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) return console.error(`Failed to bind: ${err.message}`);
    console.log(`Order Service (gRPC) running on port 50052`);
  });
}

main().catch(console.error);