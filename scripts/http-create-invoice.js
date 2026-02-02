const path = require('path');
const http = require('http');
const { init } = require('../src/utils/db');

(async () => {
  try {
    await init();
    const Product = require('../src/models/Product');
    const prods = await Product.find().lean();
    if (!prods || prods.length === 0) {
      console.log('No products in DB');
      process.exit(0);
    }
    const p = prods[0];
    console.log('Posting invoice for product', p.id, 'stock=', p.stock);

    const invoice = {
      id: `http-${Date.now()}`,
      date: new Date().toISOString(),
      items: [{ productId: p.id, qty: 1 }],
      subtotal: p.price || p.sellingPrice || 0,
      discount: 0,
      tax: 0,
      total: p.price || p.sellingPrice || 0,
    };

    const data = JSON.stringify(invoice);
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/invoices',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = http.request(options, (res) => {
      console.log(`STATUS: ${res.statusCode}`);
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', async () => {
        console.log('BODY:', body);
        const after = await Product.findOne({ id: p.id }).lean();
        console.log('After POST, product stock=', after ? after.stock : 'not found');
        process.exit(0);
      });
    });

    req.on('error', (e) => {
      console.error('Request error', e.message);
      process.exit(1);
    });

    req.write(data);
    req.end();

  } catch (err) {
    console.error('Error', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
