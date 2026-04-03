# Idempotency and Feature Flags Demo

This project demonstrates how to implement an idempotent API using a Redis locking mechanism and Feature Flags.
This is meant as an educational resource for engineering students.

## Architecture

*   **Node.js API**: Exposes an order creation endpoint (`/api/orders`).
*   **Redis Container**: Used to store locks and previous idempotency results.
*   **Feature Flag**: Controls whether the idempotency system is currently enabled for the application.

## Getting Started

1.  **Start Redis Server**
    ```bash
    docker-compose up -d
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Start the Server**
    ```bash
    npm start
    ```

## Demonstrations

### 1. Feature Flag Management

You can toggle the idempotency feature dynamically without restarting the application.

**Check Current Status:**
```bash
curl http://localhost:3000/admin/feature-flags
```

**Toggle Idempotency Off or On:**
```bash
curl -X POST http://localhost:3000/admin/feature-flags \
-H "Content-Type: application/json" \
-d '{"idempotency_enabled": false}'
```

### 2. Standard Idempotent Flow

With idempotency enabled (default state), any request to the order API requires an `Idempotency-Key` header.

```bash
# Request 1 (Takes ~5 seconds to process)
curl -X POST http://localhost:3000/api/orders \
-H "Content-Type: application/json" \
-H "Idempotency-Key: 12345" \
-d '{"itemId": "apple", "quantity": 10}'
```
*Wait for it to complete...*

```bash
# Request 2 (Immediately returns cached result)
curl -X POST http://localhost:3000/api/orders \
-H "Content-Type: application/json" \
-H "Idempotency-Key: 12345" \
-d '{"itemId": "apple", "quantity": 10}'
```

### 3. Redis Locking Demonstration (Concurrent Requests)

When two requests with the *same* `Idempotency-Key` are fired almost simultaneously, the first request will acquire a lock on Redis, and the second one will hit a `409 Conflict` because the request is still processing.

**Open two terminal windows and try running this command simultaneously in both:**

```bash
# In Terminal A
curl -D - -X POST http://localhost:3000/api/orders \
-H "Content-Type: application/json" \
-H "Idempotency-Key: my-concurrent-key-v1" \
-d '{"itemId": "orange", "quantity": 5}'

# In Terminal B (Immediately after running A)
curl -D - -X POST http://localhost:3000/api/orders \
-H "Content-Type: application/json" \
-H "Idempotency-Key: my-concurrent-key-v1" \
-d '{"itemId": "orange", "quantity": 5}'
```

The first one will wait for 5 seconds and return `201 Created`.
The second one will immediately return `409 Conflict`.
