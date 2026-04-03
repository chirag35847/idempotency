const { getFeatureFlags, updateFeatureFlags } = require('../config/featureFlags');

const getFlags = async (req, res) => {
    res.json(await getFeatureFlags());
};

const updateFlags = async (req, res) => {
    const updatedFlags = await updateFeatureFlags(req.body);
    res.json({ message: "Feature flags updated", flags: updatedFlags });
};

module.exports = { getFlags, updateFlags };
