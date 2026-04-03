const { AsyncLocalStorage } = require('async_hooks');
const crypto = require('crypto');
const { Kafka, Partitioners } = require('kafkajs');

const asyncLocalStorage = new AsyncLocalStorage();

// Initialize Kafka Connection
const kafka = new Kafka({
    clientId: 'idempotency-logger',
    brokers: ['localhost:9092']
});
const producer = kafka.producer({ createPartitioner: Partitioners.LegacyPartitioner });

// Connect immediately, avoiding block on initial connection
producer.connect().catch(err => console.error("Could not connect Kafka Producer:", err));

const formatMessage = (level, message, meta) => {
    const traceId = asyncLocalStorage.getStore() || 'NO-TRACE';
    const timestamp = new Date().toISOString();
    let metaString = '';
    if (meta && meta.length > 0) {
        metaString = ' ' + meta.map(m => typeof m === 'object' ? JSON.stringify(m) : m).join(' ');
    }
    return `[${timestamp}] [${level}] [TraceID: ${traceId}] ${message}${metaString}`;
};

const publishToKafka = async (level, message, traceId, meta) => {
    try {
        const payload = {
            timestamp: new Date().toISOString(),
            level,
            traceId,
            message,
            meta: meta && meta.length > 0 ? meta : undefined
        };
        await producer.send({
            topic: 'application-logs',
            messages: [{ value: JSON.stringify(payload) }],
        });
    } catch (error) {
        // Fallback to console if kafka goes down
        console.error("Failed to publish log to Kafka", error.message);
    }
};

const logWithPublish = (level, consoleFunc, msg, meta) => {
    // 1. Log to standard console
    consoleFunc(formatMessage(level, msg, meta));
    
    // 2. Publish to Kafka concurrently
    const traceId = asyncLocalStorage.getStore() || 'NO-TRACE';
    publishToKafka(level, msg, traceId, meta);
};

const logger = {
    info: (msg, ...meta) => logWithPublish('INFO', console.log, msg, meta),
    debug: (msg, ...meta) => logWithPublish('DEBUG', console.debug, msg, meta),
    error: (msg, ...meta) => logWithPublish('ERROR', console.error, msg, meta),
    warn: (msg, ...meta) => logWithPublish('WARN', console.warn, msg, meta),
};

const traceMiddleware = (req, res, next) => {
    const traceId = req.headers['x-trace-id'] || crypto.randomUUID();
    
    // Set traceId on request and response headers for debugging
    req.traceId = traceId;
    res.setHeader('x-trace-id', traceId);

    // Run the rest of the request within the async storage context
    asyncLocalStorage.run(traceId, () => {
        next();
    });
};

module.exports = {
    logger,
    traceMiddleware,
    asyncLocalStorage
};
