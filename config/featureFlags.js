// Simple in-memory feature flags store
let FEATURE_FLAGS = {
    idempotency_enabled: true
};

const getFeatureFlags = () => FEATURE_FLAGS;

const updateFeatureFlags = (newFlags) => {
    if (typeof newFlags.idempotency_enabled === 'boolean') {
        FEATURE_FLAGS.idempotency_enabled = newFlags.idempotency_enabled;
    }
    return FEATURE_FLAGS;
};

module.exports = { getFeatureFlags, updateFeatureFlags };
