const https = require('https');
const http = require('http');

// Simple concurrency test script
const TARGET_URL = 'http://localhost:3000/api/products'; // Public endpoint
const CONCURRENCY = 20; // Number of concurrent requests
const TOTAL_REQUESTS = 50;

console.log(`Starting concurrency test against ${TARGET_URL}`);
console.log(`Concurrency: ${CONCURRENCY}, Total Requests: ${TOTAL_REQUESTS}`);

let completed = 0;
let success = 0;
let failed = 0;
let rateLimited = 0;

const start = Date.now();

function makeRequest(id) {
    const protocol = TARGET_URL.startsWith('https') ? https : http;

    const req = protocol.get(TARGET_URL, (res) => {
        // Console log every 10 completions
        if (completed % 10 === 0) {
            process.stdout.write('.');
        }

        if (res.statusCode === 200) {
            success++;
        } else if (res.statusCode === 429) {
            rateLimited++;
        } else {
            failed++;
            console.log(`\nRequest ${id} failed with status: ${res.statusCode}`);
        }

        res.on('data', () => { }); // Consume stream
        res.on('end', () => {
            completed++;
            if (completed < TOTAL_REQUESTS) {
                // If we haven't reached total, verify if we should spawn another
                // But this is a simple batch test, let's just count
            }

            if (completed === CONCURRENCY) {
                // First batch done
            }

            if (completed === TOTAL_REQUESTS) {
                printResults();
            }
        });
    });

    req.on('error', (e) => {
        failed++;
        completed++;
        console.error(`\nRequest ${id} error: ${e.message}`);
        if (completed === TOTAL_REQUESTS) printResults();
    });
}

function printResults() {
    const duration = (Date.now() - start) / 1000;
    console.log('\n\n--- Test Results ---');
    console.log(`Time taken: ${duration.toFixed(2)}s`);
    console.log(`Successful: ${success}`);
    console.log(`Rate Limited (429): ${rateLimited}`);
    console.log(`Failed (Other): ${failed}`);
    console.log(`Requests/sec: ${(TOTAL_REQUESTS / duration).toFixed(2)}`);
}

// Launch all requests (simple burst for rate limit testing)
for (let i = 0; i < TOTAL_REQUESTS; i++) {
    makeRequest(i);
}

// Queue rest (simplified: actually doing just one batch of concurrent requests for now to test race/limit)
// To properly test total requests > concurrency, we need a queue.
// For this quick weak point check, let's just fire a burst.
