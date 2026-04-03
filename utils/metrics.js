const promClient = require('prom-client');

// Create a Registry
const register = new promClient.Registry();

// Add default metrics (CPU, memory, garbage collection, etc.)
promClient.collectDefaultMetrics({ register });

// Create a custom histogram for API latency
const httpRequestDurationMs = new promClient.Histogram({
    name: 'http_request_duration_ms',
    help: 'Duration of HTTP requests in ms',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000] // buckets for response time
});

register.registerMetric(httpRequestDurationMs);

// Middleware to measure the time taken to process requests
const metricsMiddleware = (req, res, next) => {
    const start = process.hrtime();

    res.on('finish', () => {
        const diff = process.hrtime(start);
        const responseTimeInMs = (diff[0] * 1e3) + (diff[1] * 1e-6);

        // Record metrics with labels
        httpRequestDurationMs.labels(
            req.method, 
            req.route ? req.route.path : req.path, 
            res.statusCode
        ).observe(responseTimeInMs);
    });

    next();
};

const exposeMetrics = async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
};

module.exports = {
    metricsMiddleware,
    exposeMetrics,
    register
};
