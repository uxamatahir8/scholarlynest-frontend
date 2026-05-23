const http = require('http');

http.get('http://localhost:3000/admin/posts/new', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    if (data.includes('This page couldn')) {
      console.log('FOUND ERROR TEXT!');
    }
  });
}).on('error', err => {
  console.log('Error: ', err.message);
});
