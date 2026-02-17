const Invoice = require('../models/Invoice');
const Refund = require('../models/Refund');
const Product = require('../models/Product');
const BillingHistory = require('../models/BillingHistory');
const { v4: uuid } = require('uuid');

async function createRefund(data) {
  const { invoiceId, items, reason, refundMethod, restock, orgId } = data;

  console.log('[RefundService] Creating refund with data:', { invoiceId, itemsCount: items?.length, reason, refundMethod, restock, orgId });

  // Validate required fields
  if (!invoiceId) {
    throw new Error('invoiceId is required');
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error('items array is required and must not be empty');
  }
  if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
    throw new Error('reason is required');
  }

  // 1. Validate invoice exists - check Invoice collection first
  let invoice = await Invoice.findOne({ id: invoiceId });
  console.log('[RefundService] Invoice lookup result:', invoice ? 'Found in Invoice collection' : 'Not found in Invoice collection');
  
  // If not found in Invoice, check BillingHistory (which also stores invoice data)
  // The invoiceId passed might be the BillingHistory id (UUID) or the actual invoiceId
  if (!invoice) {
    console.log('[RefundService] Checking BillingHistory for invoiceId:', invoiceId);
    const billingRecord = await BillingHistory.findOne({ 
      $or: [
        { id: invoiceId },           // Match by BillingHistory id (UUID)
        { invoiceId: invoiceId }     // Match by invoiceId field
      ]
    });
    
    console.log('[RefundService] BillingHistory lookup result:', billingRecord ? 'Found' : 'Not found');
    
    if (billingRecord) {
      console.log('[RefundService] BillingHistory record found:', {
        id: billingRecord.id,
        invoiceId: billingRecord.invoiceId,
        total: billingRecord.total,
        itemsCount: billingRecord.items?.length
      });
      // Convert BillingHistory to Invoice-like structure
      // Use invoiceId from billingRecord as the actual invoice ID
      const actualInvoiceIdFromBilling = billingRecord.invoiceId || billingRecord.id;
      
      invoice = {
        id: actualInvoiceIdFromBilling,  // Use invoiceId field as the actual invoice ID
        orgId: billingRecord.orgId,
        customerId: billingRecord.customer?.id || billingRecord.customerId || null,
        date: billingRecord.billingDate || billingRecord.createdAt,
        items: billingRecord.items || [],
        subtotal: billingRecord.subtotal || 0,
        tax: billingRecord.tax || 0,
        discount: billingRecord.discount || 0,
        total: billingRecord.total || 0,
        status: billingRecord.paymentStatus || 'paid',
        refundTotal: billingRecord.refundTotal || 0, // Use existing refundTotal if available
        refundStatus: billingRecord.refundStatus || 'none',
        createdAt: billingRecord.createdAt,
        updatedAt: billingRecord.updatedAt,
        // Mark as BillingHistory record so we know to update BillingHistory instead
        _isBillingHistory: true,
        _billingHistoryId: billingRecord.id || billingRecord._id.toString(),
      };
    }
  }
  
  if (!invoice) {
    console.error('[RefundService] Invoice not found for invoiceId:', invoiceId);
    throw new Error(`Invoice not found for ID: ${invoiceId}`);
  }
  
  console.log('[RefundService] Invoice found:', {
    id: invoice.id,
    total: invoice.total,
    itemsCount: invoice.items?.length,
    refundTotal: invoice.refundTotal,
    refundStatus: invoice.refundStatus
  });

  // Use the actual invoice ID (from invoice.id) for refund operations
  const actualInvoiceId = invoice.id;

  // 2. Calculate existing refund total from previous refunds
  const existingRefunds = await Refund.find({ 
    $or: [
      { invoiceId: actualInvoiceId },
      { invoiceId: invoiceId } // Also check the original invoiceId passed in
    ]
  });
  const refundedItems = existingRefunds.flatMap(r => r.items);
  const existingRefundTotal = existingRefunds.reduce((sum, r) => sum + (r.total || 0), 0);
  
  // Update invoice refundTotal with existing refunds if it wasn't set
  if (!invoice.refundTotal && existingRefundTotal > 0) {
    invoice.refundTotal = existingRefundTotal;
    invoice.refundStatus = invoice.refundTotal >= invoice.total ? 'full' : 'partial';
  }

  // 3. Validate refund quantity
  // 4. Prevent double refund
  console.log('[RefundService] Validating refund items. Invoice items:', invoice.items);
  console.log('[RefundService] Refund items:', items);
  
  for (const item of items) {
    console.log('[RefundService] Processing refund item:', item);
    
    // Find sold item - BillingHistory uses 'qty', Invoice might use 'quantity'
    const soldItem = invoice.items.find(i => 
      i.productId === item.productId || 
      i.id === item.productId
    );
    
    console.log('[RefundService] Found sold item:', soldItem);
    
    if (!soldItem) {
      console.error('[RefundService] Product not found in invoice. Looking for:', item.productId);
      console.error('[RefundService] Available productIds in invoice:', invoice.items.map(i => i.productId || i.id));
      throw new Error(`Product ${item.productId} not found in invoice`);
    }
    
    // Handle both 'quantity' and 'qty' field names (BillingHistory uses 'qty')
    const soldQty = soldItem.quantity || soldItem.qty || 0;
    const alreadyRefundedQty = refundedItems
      .filter(i => i.productId === item.productId)
      .reduce((sum, i) => sum + (i.quantity || 0), 0);

    if (item.quantity > (soldQty - alreadyRefundedQty)) {
      throw new Error(`Refund quantity for product ${item.productId} exceeds available quantity. Available: ${soldQty - alreadyRefundedQty}, Requested: ${item.quantity}`);
    }
  }

  // 4. Create refund record
  // Calculate refund amounts based on actual item prices and quantities
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  
  // Calculate tax based on the original invoice tax rate
  // Use proportional tax if invoice has tax, otherwise use 0
  let tax = 0;
  if (invoice.tax && invoice.subtotal > 0 && invoice.subtotal > 0) {
    // Use proportional tax based on refunded subtotal
    tax = Math.round((subtotal / invoice.subtotal) * invoice.tax * 100) / 100;
  }
  // If invoice tax is 0, refund tax is also 0
  
  const total = Math.round((subtotal + tax) * 100) / 100;
  
  console.log('[RefundService] Refund calculation:', { 
    subtotal, 
    tax, 
    total,
    invoiceSubtotal: invoice.subtotal,
    invoiceTax: invoice.tax
  });

  const refund = new Refund({
    orgId,
    invoiceId: actualInvoiceId, // Use the actual invoice ID
    refundNumber: `REF-${Date.now()}`,
    items,
    subtotal,
    tax,
    total,
    reason,
    refundMethod,
    restock,
  });

  await refund.save();

  // 5. Update invoice refundTotal
  invoice.refundTotal = (invoice.refundTotal || 0) + total;

  // 6. Update invoice refundStatus
  if (invoice.refundTotal >= invoice.total) {
    invoice.refundStatus = 'full';
  } else {
    invoice.refundStatus = 'partial';
  }

  // If this was from BillingHistory, update BillingHistory instead
  if (invoice._isBillingHistory) {
    console.log('[RefundService] Updating BillingHistory record:', invoice._billingHistoryId);
    console.log('[RefundService] Updating with refundTotal:', invoice.refundTotal, 'refundStatus:', invoice.refundStatus);
    
    const updateResult = await BillingHistory.findOneAndUpdate(
      { id: invoice._billingHistoryId },
      { 
        $set: {
          refundTotal: invoice.refundTotal,
          refundStatus: invoice.refundStatus,
          updatedAt: new Date().toISOString()
        }
      },
      { new: true } // Return updated document
    );
    
    console.log('[RefundService] BillingHistory update result:', updateResult ? 'Success' : 'Failed');
    
    if (!updateResult) {
      console.error('[RefundService] Failed to update BillingHistory record');
      throw new Error('Failed to update billing history record');
    }
  } else {
    // Update Invoice collection
    console.log('[RefundService] Updating Invoice collection:', invoice.id);
    const updateResult = await Invoice.findOneAndUpdate(
      { id: invoice.id },
      {
        $set: {
          refundTotal: invoice.refundTotal,
          refundStatus: invoice.refundStatus,
          updatedAt: new Date().toISOString()
        }
      },
      { new: true }
    );
    
    if (!updateResult) {
      console.error('[RefundService] Failed to update Invoice record');
      throw new Error('Failed to update invoice record');
    }
  }

  // 7. Adjust stock
  if (restock) {
    console.log('[RefundService] Restocking products...');
    for (const item of items) {
      // Use findOne with custom id field - try org-specific first, then global
      let product = orgId 
        ? await Product.findOne({ id: item.productId, orgId })
        : null;
      if (!product) {
        product = await Product.findOne({ id: item.productId });
      }
      if (product) {
        const oldStock = product.stock || 0;
        product.stock = (product.stock || 0) + item.quantity;
        await product.save();
        console.log(`[RefundService] Restocked product ${item.productId}: ${oldStock} -> ${product.stock} (+${item.quantity})`);
      } else {
        console.warn(`[RefundService] Product ${item.productId} not found for restocking`);
      }
    }
  }

  // 8. Return updated invoice/BillingHistory
  // If it was from BillingHistory, fetch and return the updated record
  if (invoice._isBillingHistory) {
    const updatedBillingHistory = await BillingHistory.findOne({ id: invoice._billingHistoryId }).lean();
    if (updatedBillingHistory) {
      // Convert back to invoice-like structure for response
      return {
        id: updatedBillingHistory.invoiceId || updatedBillingHistory.id,
        orgId: updatedBillingHistory.orgId,
        customerId: updatedBillingHistory.customer?.id || null,
        date: updatedBillingHistory.billingDate || updatedBillingHistory.createdAt,
        items: updatedBillingHistory.items || [],
        subtotal: updatedBillingHistory.subtotal || 0,
        tax: updatedBillingHistory.tax || 0,
        discount: updatedBillingHistory.discount || 0,
        total: updatedBillingHistory.total || 0,
        status: updatedBillingHistory.paymentStatus || 'paid',
        refundTotal: updatedBillingHistory.refundTotal || 0,
        refundStatus: updatedBillingHistory.refundStatus || 'none',
        createdAt: updatedBillingHistory.createdAt,
        updatedAt: updatedBillingHistory.updatedAt,
      };
    }
  }
  
  // Return updated invoice
  return invoice;
}

module.exports = {
  createRefund,
};
