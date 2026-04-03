const { redisClient } = require('./redis');

const getFeatureFlags = async () => {
    try {
        const flagsStr = await redisClient.get('FEATURE_FLAGS');
        if (flagsStr) {
            return JSON.parse(flagsStr);
        }
    } catch (err) {
        console.error("Redis get failed for FEATURE_FLAGS", err);
    }
    return { idempotency_enabled: true };
};

const updateFeatureFlags = async (newFlags) => {
    const currentFlags = await getFeatureFlags();
    if (typeof newFlags.idempotency_enabled === 'boolean') {
        currentFlags.idempotency_enabled = newFlags.idempotency_enabled;
    }
    
    try {
        await redisClient.set('FEATURE_FLAGS', JSON.stringify(currentFlags));
    } catch (err) {
        console.error("Redis set failed for FEATURE_FLAGS", err);
    }
    
    return currentFlags;
};

module.exports = { getFeatureFlags, updateFeatureFlags };
