"use strict";

var EventEmitter = require('events'); // Bind to the same local mock broker instance


if (!global.sharedEventBroker) {
  global.sharedEventBroker = new EventEmitter();
}

function run() {
  return regeneratorRuntime.async(function run$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          console.log("🚀 [LOCAL MODE] Notification Worker initialized.");
          console.log("Subscribed to reactive 'order-events' channel...");
          global.sharedEventBroker.on('order-events', function (rawData) {
            var parsedEvent = JSON.parse(rawData);
            console.log("\n=============================================");
            console.log("\uD83D\uDD14 [NOTIFICATION RECEIVED] Event: ".concat(parsedEvent.event));
            console.log("\uD83D\uDCE6 Order ID: ".concat(parsedEvent.orderId));
            console.log("\uD83D\uDD22 Product Code: ".concat(parsedEvent.productId, " | Qty: ").concat(parsedEvent.quantity));
            console.log("=============================================\n");
          });

        case 3:
        case "end":
          return _context.stop();
      }
    }
  });
}

run()["catch"](console.error);
//# sourceMappingURL=app.dev.js.map
