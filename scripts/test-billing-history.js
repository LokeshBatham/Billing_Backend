const path = require('path');
const fs = require('fs');
const { init } = require('../src/utils/db');

// Fallback: read .env from Billing_Backend directory
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
    const BillingHistory = require('../src/models/BillingHistory');
    const { createInvoice } = require('../src/services/invoiceService');
    const Product = require('../src/models/Product');

    const prods = await Product.find().lean();
    if (!prods || prods.length === 0) {
      console.log('No products in DB');
      process.exit(0);
    }

    const p = prods[0];
    console.log('Creating invoice with detailed billing data...');

    const invoice = {
      id: `test-billing-${Date.now()}`,
      date: new Date().toISOString(),
      items: [{ productId: p.id, qty: 2, name: p.name, price: p.sellingPrice || p.price }],
      subtotal: (p.sellingPrice || p.price) * 2,
      discount: 100,
      tax: 180,
      total: (p.sellingPrice || p.price) * 2 - 100 + 180,
      paymentStatus: 'paid',
      paymentMethod: 'UPI',
      transactionId: 'TXN' + Date.now(),
      currency: 'INR',
      billingPeriod: 'Feb 2024',
      customer: { name: 'Test Customer', email: 'test@example.com' },
    };

    const created = await createInvoice(invoice);
    console.log('Created invoice:', created.id);

    const billing = await BillingHistory.findOne({ invoiceId: created.id }).lean();
    console.log('Billing history record:');
    console.log(JSON.stringify(billing, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Test error', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
