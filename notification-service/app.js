const EventEmitter = require('events');

// Bind to the same local mock broker instance
if (!global.sharedEventBroker) {
  global.sharedEventBroker = new EventEmitter();
}

async function run() {
  console.log("🚀 [LOCAL MODE] Notification Worker initialized.");
  console.log("Subscribed to reactive 'order-events' channel...");

  global.sharedEventBroker.on('order-events', (rawData) => {
    const parsedEvent = JSON.parse(rawData);
    
    console.log("\n=============================================");
    console.log(`🔔 [NOTIFICATION RECEIVED] Event: ${parsedEvent.event}`);
    console.log(`📦 Order ID: ${parsedEvent.orderId}`);
    console.log(`🔢 Product Code: ${parsedEvent.productId} | Qty: ${parsedEvent.quantity}`);
    console.log("=============================================\n");
  });
}

run().catch(console.error);