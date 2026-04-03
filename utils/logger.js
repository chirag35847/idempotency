const { AsyncLocalStorage } = require('async_hooks');
const crypto = require('crypto');

const asyncLocalStorage = new AsyncLocalStorage();

const formatMessage = (level, message, meta) => {
    const traceId = asyncLocalStorage.getStore() || 'NO-TRACE';
    const timestamp = new Date().toISOString();
    let metaString = '';
    if (meta && meta.length > 0) {
        metaString = ' ' + meta.map(m => typeof m === 'object' ? JSON.stringify(m) : m).join(' ');
    }
    return `[${timestamp}] [${level}] [TraceID: ${traceId}] ${message}${metaString}`;
};

const logger = {
    info: (msg, ...meta) => console.log(formatMessage('INFO', msg, meta)),
    debug: (msg, ...meta) => console.debug(formatMessage('DEBUG', msg, meta)),
    error: (msg, ...meta) => console.error(formatMessage('ERROR', msg, meta)),
    warn: (msg, ...meta) => console.warn(formatMessage('WARN', msg, meta)),
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
