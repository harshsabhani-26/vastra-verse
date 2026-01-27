// Native fetch is available in Node 18+

async function testApi() {
    const baseUrl = 'http://localhost:3000';

    console.log('Testing GET /api/admin/orders...');
    try {
        const getRes = await fetch(`${baseUrl}/api/admin/orders`);
        const getContentType = getRes.headers.get('content-type');
        console.log(`GET Status: ${getRes.status}`);
        console.log(`GET Content-Type: ${getContentType}`);

        if (getRes.status === 200 && getContentType.includes('application/json')) {
            const orders = await getRes.json();
            console.log(`Fetched ${orders.length} orders.`);

            if (orders.length > 0) {
                const orderId = orders[0].id;
                console.log(`Testing PATCH /api/admin/orders/${orderId}...`);

                // Try to update status to same status to be safe (or just check if it accepts request)
                const currentStatus = orders[0].status;
                // Don't actually change it, just send same status to test connectivity
                const patchRes = await fetch(`${baseUrl}/api/admin/orders/${orderId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: currentStatus })
                });

                const patchContentType = patchRes.headers.get('content-type');
                console.log(`PATCH Status: ${patchRes.status}`);
                console.log(`PATCH Content-Type: ${patchContentType}`);

                const patchText = await patchRes.text();
                // console.log('PATCH Response Body:', patchText.substring(0, 200)); 

                try {
                    const patchJson = JSON.parse(patchText);
                    console.log('PATCH JSON:', patchJson);
                } catch (e) {
                    console.error('PATCH Response is NOT JSON:', patchText.substring(0, 100)); // Show first 100 chars
                }
            } else {
                console.log('No orders to test PATCH.');
            }
        } else {
            console.log('GET failed or not JSON.');
            const text = await getRes.text();
            console.log('GET Response:', text.substring(0, 100));
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// In Node 18+, fetch is global. If <18, might fail.
// This project uses Next.js 16/Node 20 types, so likely Node 20+.
testApi();
