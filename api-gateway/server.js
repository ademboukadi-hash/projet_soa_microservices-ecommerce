const express = require('express');
const { ApolloServer } = require('@apollo/server');
const cors = require('cors');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const app = express();
app.use(express.json());
app.use(cors());

// --- 1. SETUP gRPC CLIENTS ---
const PRODUCT_PROTO_PATH = 'C:\\Users\\MSI\\Desktop\\projet_sca\\protos\\product.proto';
const ORDER_PROTO_PATH = 'C:\\Users\\MSI\\Desktop\\projet_sca\\protos\\order.proto';

// Load Product Service Contract
const productDef = protoLoader.loadSync(PRODUCT_PROTO_PATH, { keepCase: true });
const productProto = grpc.loadPackageDefinition(productDef).product;
const productClient = new productProto.ProductService('127.0.0.1:50051', grpc.credentials.createInsecure());

// Load Order Service Contract
const orderDef = protoLoader.loadSync(ORDER_PROTO_PATH, { keepCase: true });
const orderProto = grpc.loadPackageDefinition(orderDef).order;
const orderClient = new orderProto.OrderService('127.0.0.1:50052', grpc.credentials.createInsecure());


// --- 2. REST API ENDPOINTS ---

// GET /api/products -> Proxies to Product Service via gRPC
app.get('/api/products', (req, res) => {
  productClient.GetProducts({}, (err, response) => {
    if (err) return res.status(500).json({ error: "Product service unreachable", details: err.message });
    res.json(response.products || []);
  });
});

// POST /api/orders -> Proxies to Order Service via gRPC
app.post('/api/orders', (req, res) => {
  const { productId, quantity } = req.body;
  orderClient.CreateOrder({ productId, quantity }, (err, response) => {
    if (err) return res.status(500).json({ error: "Order service unreachable", details: err.message });
    res.status(201).json(response);
  });
});


// --- 3. GRAPHQL ENGINE ---
const typeDefs = `#graphql
  type Product {
    id: String!
    name: String!
    price: Float!
    stock: Int!
  }

  type OrderResponse {
    orderId: String!
    status: String!
  }

  type Query {
    products: [Product]
  }

  type Mutation {
    createOrder(productId: String!, quantity: Int!): OrderResponse
  }
`;

const resolvers = {
  Query: {
    products: () => {
      return new Promise((resolve, reject) => {
        productClient.GetProducts({}, (err, response) => {
          if (err) reject(err);
          else resolve(response.products || []);
        });
      });
    }
  },
  Mutation: {
    createOrder: (_, { productId, quantity }) => {
      return new Promise((resolve, reject) => {
        orderClient.CreateOrder({ productId, quantity }, (err, response) => {
          if (err) reject(err);
          else resolve(response);
        });
      });
    }
  }
};


// --- 4. START THE SERVER ---
async function startServer() {
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();

  // Native Apollo HTTP execution fallback to completely bypass subpath package export glitches
  app.use('/graphql', cors(), express.json(), (req, res, next) => {
    server.executeHTTPGraphQLRequest({
      httpGraphQLRequest: {
        method: req.method,
        headers: new Map(Object.entries(req.headers)),
        search: new URL(req.url, `http://${req.headers.host || 'localhost'}`).search,
        body: req.body,
      },
      context: async () => ({})
    })
    .then((httpGraphQLResponse) => {
      res.status(httpGraphQLResponse.status || 200);
      for (const [key, value] of httpGraphQLResponse.headers.entries()) {
        res.setHeader(key, value);
      }
      if (httpGraphQLResponse.body.kind === 'complete') {
        res.send(httpGraphQLResponse.body.string);
      } else {
        res.send(httpGraphQLResponse.body.string);
      }
    })
    .catch((error) => next(error));
  });

  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(`🚀 API Gateway operational on http://localhost:${PORT}`);
    console.log(`📡 REST API Endpoints active: /api/products & /api/orders`);
    console.log(`🔮 GraphQL Endpoint interactive on: http://localhost:${PORT}/graphql`);
    console.log(`===================================================`);
  });
}

startServer().catch(console.error);