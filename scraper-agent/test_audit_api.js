
// using native fetch

async function testAudit() {
    const token = '2a7113f5-117b-4c9a-bc69-a02286d7d85b';
    const url = `http://localhost:3001/api/audit/${token}`;

    console.log(`Testing GET ${url}...`);

    try {
        const res = await fetch(url);
        console.log(`Status: ${res.status} ${res.statusText}`);

        const data = await res.json();
        console.log('Response Body:', JSON.stringify(data, null, 2));

    } catch (err) {
        console.error('Fetch error:', err);
    }
}

testAudit();
