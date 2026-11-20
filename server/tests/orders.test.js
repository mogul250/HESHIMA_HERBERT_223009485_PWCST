import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import jwt from 'jsonwebtoken';
import { app } from '../server.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import { JWT_SECRET } from '../middleware/auth.js';

// In-memory HTTP simulator that executes Express without TCP sockets (sandbox safe!)
function simulateRequest(app, { method = 'GET', url = '/', headers = {}, body = null }) {
  return new Promise((resolve) => {
    const [path, queryString] = url.split('?');
    const query = {};
    if (queryString) {
      new URLSearchParams(queryString).forEach((val, key) => {
        query[key] = val;
      });
    }

    // Mock Express Request
    const req = {
      method: method.toUpperCase(),
      url,
      path,
      originalUrl: url,
      baseUrl: '',
      query,
      params: {},
      headers: {
        'content-type': 'application/json',
        ...Object.keys(headers).reduce((acc, k) => {
          acc[k.toLowerCase()] = headers[k];
          return acc;
        }, {}),
      },
      body: body || {},
      app,
      get(header) {
        return this.headers[header.toLowerCase()];
      },
    };

    let statusCode = 200;
    const responseHeaders = {};

    // Mock Express Response
    const res = {
      statusCode: 200,
      headersSent: false,
      status(code) {
        statusCode = code;
        this.statusCode = code;
        return this;
      },
      set(key, val) {
        responseHeaders[key] = val;
        return this;
      },
      setHeader(key, val) {
        responseHeaders[key] = val;
        return this;
      },
      getHeader(key) {
        return responseHeaders[key];
      },
      json(data) {
        this.headersSent = true;
        resolve({
          status: statusCode,
          statusCode,
          headers: responseHeaders,
          body: data,
        });
        return this;
      },
      send(data) {
        this.headersSent = true;
        let parsed = data;
        try {
          parsed = JSON.parse(data);
        } catch {}
        resolve({
          status: statusCode,
          statusCode,
          headers: responseHeaders,
          body: parsed,
        });
        return this;
      },
      end() {
        this.headersSent = true;
        resolve({
          status: statusCode,
          statusCode,
          headers: responseHeaders,
          body: null,
        });
        return this;
      },
    };

    app.handle(req, res);
  });
}

describe('Restaurant Order API Tests (Unit & Route Integration)', () => {
  const waiterId = '660000000000000000000001';
  const kitchenId = '660000000000000000000002';
  const sampleOrderId = '660000000000000000000099';

  let waiterToken;
  let kitchenToken;
  let mockOrders = {};

  before(() => {
    waiterToken = jwt.sign({ id: waiterId }, JWT_SECRET, { expiresIn: '1h' });
    kitchenToken = jwt.sign({ id: kitchenId }, JWT_SECRET, { expiresIn: '1h' });

    // Mock User.findById for authentication middleware
    User.findById = (id) => ({
      select: () => {
        if (String(id) === waiterId) {
          return Promise.resolve({ _id: waiterId, name: 'Waiter Sarah', role: 'waiter' });
        }
        if (String(id) === kitchenId) {
          return Promise.resolve({ _id: kitchenId, name: 'Chef Marco', role: 'kitchen' });
        }
        return Promise.resolve(null);
      },
    });

    // Mock Order methods
    Order.prototype.save = function () {
      mockOrders[this._id] = this;
      return Promise.resolve(this);
    };

    Order.findById = (id) => {
      const data = mockOrders[id];
      if (!data) {
        return {
          populate: () => Promise.resolve(null),
          then: (cb) => Promise.resolve(null).then(cb),
        };
      }

      const doc = {
        ...data,
        _id: data._id || id,
        status: data.status,
        tableNumber: data.tableNumber,
        items: data.items,
        totalAmount: data.totalAmount,
        waiterName: data.waiterName,
        save: function () {
          mockOrders[this._id] = { ...this };
          return Promise.resolve(this);
        },
      };

      return {
        populate: () => Promise.resolve(doc),
        then: (cb) => Promise.resolve(doc).then(cb),
      };
    };

    Order.countDocuments = () => Promise.resolve(Object.keys(mockOrders).length);
    Order.find = () => ({
      populate: () => ({
        sort: () => ({
          skip: () => ({
            limit: () => Promise.resolve(Object.values(mockOrders)),
          }),
        }),
      }),
    });
  });

  // TEST 1: SUCCESS - Waiter creates an order
  it('1. [SUCCESS] Waiter successfully creates an order with valid table and items', async () => {
    const res = await simulateRequest(app, {
      method: 'POST',
      url: '/api/orders',
      headers: { Authorization: `Bearer ${waiterToken}` },
      body: {
        tableNumber: 5,
        items: [
          {
            name: 'Margherita Pizza',
            price: 14.99,
            quantity: 2,
            notes: 'Extra crispy',
          },
        ],
        totalAmount: 29.98,
        notes: 'VIP table',
      },
    });

    assert.strictEqual(res.status, 201, `Expected 201, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert.strictEqual(res.body.tableNumber, 5);
    assert.strictEqual(res.body.status, 'pending');
    assert.strictEqual(res.body.items.length, 1);
    assert.strictEqual(res.body.items[0].name, 'Margherita Pizza');
  });

  // TEST 2: SUCCESS - Kitchen progresses order status from pending -> preparing -> ready
  it('2. [SUCCESS] Kitchen staff progresses order from pending to preparing, then to ready', async () => {
    mockOrders[sampleOrderId] = {
      _id: sampleOrderId,
      tableNumber: 3,
      items: [{ name: 'Pasta Carbonara', price: 16.5, quantity: 1 }],
      status: 'pending',
      totalAmount: 16.5,
      waiterName: 'Sarah',
    };

    // 2a. pending -> preparing
    const prepRes = await simulateRequest(app, {
      method: 'PATCH',
      url: `/api/orders/${sampleOrderId}/status`,
      headers: { Authorization: `Bearer ${kitchenToken}` },
      body: { status: 'preparing' },
    });

    assert.strictEqual(prepRes.status, 200, `Failed transitioning to preparing: ${JSON.stringify(prepRes.body)}`);
    assert.strictEqual(prepRes.body.status, 'preparing');

    // 2b. preparing -> ready
    const readyRes = await simulateRequest(app, {
      method: 'PATCH',
      url: `/api/orders/${sampleOrderId}/status`,
      headers: { Authorization: `Bearer ${kitchenToken}` },
      body: { status: 'ready' },
    });

    assert.strictEqual(readyRes.status, 200, `Failed transitioning to ready: ${JSON.stringify(readyRes.body)}`);
    assert.strictEqual(readyRes.body.status, 'ready');
  });

  // TEST 3: BAD INPUT - Validation rejects missing table number or empty items
  it('3. [BAD INPUT] Rejects order creation with invalid table number or empty items', async () => {
    // 3a. Invalid table number
    const badTableRes = await simulateRequest(app, {
      method: 'POST',
      url: '/api/orders',
      headers: { Authorization: `Bearer ${waiterToken}` },
      body: {
        tableNumber: -2,
        items: [{ name: 'Pizza', price: 10, quantity: 1 }],
      },
    });

    assert.strictEqual(badTableRes.status, 400);
    assert.match(badTableRes.body.error, /dining table/i);

    // 3b. Empty items array
    const emptyItemsRes = await simulateRequest(app, {
      method: 'POST',
      url: '/api/orders',
      headers: { Authorization: `Bearer ${waiterToken}` },
      body: {
        tableNumber: 3,
        items: [],
      },
    });

    assert.strictEqual(emptyItemsRes.status, 400);
    assert.match(emptyItemsRes.body.error, /Order must contain at least one item/i);
  });

  // TEST 4: BREAK IT ON PURPOSE & VALIDATION - Kitchen marks served before cooking
  it('4. [INVALID TRANSITION] Rejects marking order as served before cooking (state validation)', async () => {
    const uncookedOrderId = '660000000000000000000077';
    // Order is currently 'pending' (uncooked)
    mockOrders[uncookedOrderId] = {
      _id: uncookedOrderId,
      tableNumber: 7,
      items: [{ name: 'Steak', price: 32, quantity: 1 }],
      status: 'pending',
      totalAmount: 32,
    };

    // Attempt to mark as 'served' before cooking
    const res = await simulateRequest(app, {
      method: 'PATCH',
      url: `/api/orders/${uncookedOrderId}/status`,
      headers: { Authorization: `Bearer ${waiterToken}` },
      body: { status: 'served' },
    });

    assert.strictEqual(res.status, 400, `Expected 400 Bad Request, got ${res.status}`);
    assert.ok(res.body.error, 'Response must include error message');
    assert.match(
      res.body.error,
      /Cannot mark order as 'served' before cooking/i,
      `Expected message explaining cooking requirement, got: ${res.body.error}`
    );
  });

  // TEST 5: WRONG ROLE / UNAUTHORIZED - Kitchen staff cannot create orders
  it('5. [WRONG ROLE] Rejects order creation by kitchen staff (requires waiter role)', async () => {
    const res = await simulateRequest(app, {
      method: 'POST',
      url: '/api/orders',
      headers: { Authorization: `Bearer ${kitchenToken}` }, // Kitchen role attempting to create order
      body: {
        tableNumber: 4,
        items: [{ name: 'Salad', price: 9, quantity: 1 }],
        totalAmount: 9,
      },
    });

    assert.strictEqual(res.status, 403, `Expected status 403 Forbidden, got ${res.status}`);
    assert.match(res.body.error, /User role 'kitchen' is not authorized/i);
  });
});
