const User = require("../models/User");

exports.getMe = async (req, res) => {
  try {
    const decoded = req.user || null;
    const userId = decoded?.sub || decoded?.userId || null;
    const orgId = req.orgId || decoded?.orgId || null;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const query = { _id: userId };
    if (orgId) query.orgId = orgId;

    const user = await User.findOne(query).select("-passwordHash").exec();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ user: user.toObject() });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[User] getMe error", error);
    return res.status(500).json({ error: "Failed to fetch user profile" });
  }
};

exports.updateRazorpayKeyId = async (req, res) => {
  try {
    const decoded = req.user || null;
    const userId = decoded?.sub || decoded?.userId || null;
    const orgId = req.orgId || decoded?.orgId || null;
    const role = String(decoded?.role || "").toLowerCase();

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const razorpayKeyId = String(req.body?.razorpayKeyId || "").trim();
    if (!razorpayKeyId) {
      return res.status(400).json({ error: "razorpayKeyId is required" });
    }

    const query = { _id: userId };
    if (orgId) query.orgId = orgId;

    const user = await User.findOneAndUpdate(
      query,
      { $set: { razorpayKeyId } },
      { new: true }
    )
      .select("-passwordHash")
      .exec();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ user: user.toObject() });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[User] updateRazorpayKeyId error", error);
    return res.status(500).json({ error: "Failed to update Razorpay key" });
  }
};
