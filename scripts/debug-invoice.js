const path = require('path');
const fs = require('fs');
const { init } = require('../src/utils/db');

// If VITE_MONGO_URI isn't set in environment, try to read it from .env
try {
  if (!process.env.VITE_MONGO_URI) {
    const envPath = path.resolve(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/^VITE_MONGO_URI=(.*)$/m);
      if (match && match[1]) {
        process.env.VITE_MONGO_URI = match[1].trim().replace(/^"|"$/g, '');
      }
    }
  }
} catch (e) {
  // ignore
}

(async () => {
  try {
    await init();
    const Product = require('../src/models/Product');
    const { createInvoice } = require('../src/services/invoiceService');

    const prods = await Product.find().lean();
    if (!prods || prods.length === 0) {
      console.log('No products found in DB.');
      process.exit(0);
    }

    const p = prods[0];
    console.log('Using product:', p.id, p.name, 'stock=', p.stock);

    const invoice = {
      id: `debug-${Date.now()}`,
      date: new Date().toISOString(),
      items: [{ productId: p.id, qty: 1 }],
      subtotal: p.price || p.sellingPrice || 0,
      discount: 0,
      tax: 0,
      total: p.price || p.sellingPrice || 0,
    };

    console.log('Creating invoice via service...');
    const created = await createInvoice(invoice);
    console.log('Created invoice id:', created.id);

    const after = await Product.findOne({ id: p.id }).lean();
    console.log('Product after invoice, stock=', after ? after.stock : 'not found');
    process.exit(0);
  } catch (err) {
    console.error('Debug invoice error', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
