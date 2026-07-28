const http = require('http');

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/diem?lopId=3&hocKy=1&namHoc=2025-2026',
  method: 'GET',
};

const start = Date.now();
const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}, Time: ${Date.now() - start}ms, Size: ${data.length}`);
  });
});
req.on('error', (e) => {
  console.error(`Error: ${e.message}, Time: ${Date.now() - start}ms`);
});
req.end();
