const { getFeatureFlags, updateFeatureFlags } = require('../config/featureFlags');

const getFlags = (req, res) => {
    res.json(getFeatureFlags());
};

const updateFlags = (req, res) => {
    const updatedFlags = updateFeatureFlags(req.body);
    res.json({ message: "Feature flags updated", flags: updatedFlags });
};

module.exports = { getFlags, updateFlags };
