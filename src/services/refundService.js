const Refund = require('../models/Refund');

exports.getAllRefunds = async () => {
  const refunds = await Refund.find().lean();
  return refunds.map((r) => ({ ...r, id: r._id.toString() }));
};

exports.createRefund = async (payload) => {
  const refund = await Refund.create(payload);
  return { ...refund.toObject(), id: refund._id.toString() };
};
