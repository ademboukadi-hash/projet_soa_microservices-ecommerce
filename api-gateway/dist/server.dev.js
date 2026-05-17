"use strict";

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var express = require('express');

var _require = require('@apollo/server'),
    ApolloServer = _require.ApolloServer;

var cors = require('cors');

var grpc = require('@grpc/grpc-js');

var protoLoader = require('@grpc/proto-loader');

var app = express();
app.use(express.json());
app.use(cors()); // --- 1. SETUP gRPC CLIENTS ---

var PRODUCT_PROTO_PATH = "C:\\Users\\MSI\\Desktop\\projet_sca\\protos\\product.proto";
var ORDER_PROTO_PATH = "C:\\Users\\MSI\\Desktop\\projet_sca\\protos\\order.proto"; // Load Product Service Contract

var productDef = protoLoader.loadSync(PRODUCT_PROTO_PATH, {
  keepCase: true
});
var productProto = grpc.loadPackageDefinition(productDef).product;
var productClient = new productProto.ProductService('127.0.0.1:50051', grpc.credentials.createInsecure()); // Load Order Service Contract

var orderDef = protoLoader.loadSync(ORDER_PROTO_PATH, {
  keepCase: true
});
var orderProto = grpc.loadPackageDefinition(orderDef).order;
var orderClient = new orderProto.OrderService('127.0.0.1:50052', grpc.credentials.createInsecure()); // --- 2. REST API ENDPOINTS ---
// GET /api/products -> Proxies to Product Service via gRPC

app.get('/api/products', function (req, res) {
  productClient.GetProducts({}, function (err, response) {
    if (err) return res.status(500).json({
      error: "Product service unreachable",
      details: err.message
    });
    res.json(response.products || []);
  });
}); // POST /api/orders -> Proxies to Order Service via gRPC

app.post('/api/orders', function (req, res) {
  var _req$body = req.body,
      productId = _req$body.productId,
      quantity = _req$body.quantity;
  orderClient.CreateOrder({
    productId: productId,
    quantity: quantity
  }, function (err, response) {
    if (err) return res.status(500).json({
      error: "Order service unreachable",
      details: err.message
    });
    res.status(201).json(response);
  });
}); // --- 3. GRAPHQL ENGINE ---

var typeDefs = "#graphql\n  type Product {\n    id: String!\n    name: String!\n    price: Float!\n    stock: Int!\n  }\n\n  type OrderResponse {\n    orderId: String!\n    status: String!\n  }\n\n  type Query {\n    products: [Product]\n  }\n\n  type Mutation {\n    createOrder(productId: String!, quantity: Int!): OrderResponse\n  }\n";
var resolvers = {
  Query: {
    products: function products() {
      return new Promise(function (resolve, reject) {
        productClient.GetProducts({}, function (err, response) {
          if (err) reject(err);else resolve(response.products || []);
        });
      });
    }
  },
  Mutation: {
    createOrder: function createOrder(_, _ref) {
      var productId = _ref.productId,
          quantity = _ref.quantity;
      return new Promise(function (resolve, reject) {
        orderClient.CreateOrder({
          productId: productId,
          quantity: quantity
        }, function (err, response) {
          if (err) reject(err);else resolve(response);
        });
      });
    }
  }
}; // --- 4. START THE SERVER ---

function startServer() {
  var server, PORT;
  return regeneratorRuntime.async(function startServer$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          server = new ApolloServer({
            typeDefs: typeDefs,
            resolvers: resolvers
          });
          _context2.next = 3;
          return regeneratorRuntime.awrap(server.start());

        case 3:
          // Native Apollo HTTP execution fallback to completely bypass subpath package export glitches
          app.use('/graphql', cors(), express.json(), function (req, res, next) {
            server.executeHTTPGraphQLRequest({
              httpGraphQLRequest: {
                method: req.method,
                headers: new Map(Object.entries(req.headers)),
                search: new URL(req.url, "http://".concat(req.headers.host || 'localhost')).search,
                body: req.body
              },
              context: function context() {
                return regeneratorRuntime.async(function context$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        return _context.abrupt("return", {});

                      case 1:
                      case "end":
                        return _context.stop();
                    }
                  }
                });
              }
            }).then(function (httpGraphQLResponse) {
              res.status(httpGraphQLResponse.status || 200);
              var _iteratorNormalCompletion = true;
              var _didIteratorError = false;
              var _iteratorError = undefined;

              try {
                for (var _iterator = httpGraphQLResponse.headers.entries()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                  var _step$value = _slicedToArray(_step.value, 2),
                      key = _step$value[0],
                      value = _step$value[1];

                  res.setHeader(key, value);
                }
              } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion && _iterator["return"] != null) {
                    _iterator["return"]();
                  }
                } finally {
                  if (_didIteratorError) {
                    throw _iteratorError;
                  }
                }
              }

              if (httpGraphQLResponse.body.kind === 'complete') {
                res.send(httpGraphQLResponse.body.string);
              } else {
                res.send(httpGraphQLResponse.body.string);
              }
            })["catch"](function (error) {
              return next(error);
            });
          });
          PORT = 3000;
          app.listen(PORT, function () {
            console.log("===================================================");
            console.log("\uD83D\uDE80 API Gateway operational on http://localhost:".concat(PORT));
            console.log("\uD83D\uDCE1 REST API Endpoints active: /api/products & /api/orders");
            console.log("\uD83D\uDD2E GraphQL Endpoint interactive on: http://localhost:".concat(PORT, "/graphql"));
            console.log("===================================================");
          });

        case 6:
        case "end":
          return _context2.stop();
      }
    }
  });
}

startServer()["catch"](console.error);
//# sourceMappingURL=server.dev.js.map
