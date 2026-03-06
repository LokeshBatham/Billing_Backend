const BillingHistory = require('../models/BillingHistory');

exports.getBillingHistory = async () => {
  const history = await BillingHistory.find().sort({ createdAt: -1 }).lean();
  return history.map((h) => ({ ...h, id: h._id.toString() }));
};
