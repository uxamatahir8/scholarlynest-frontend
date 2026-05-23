const { execSync } = require('child_process');
const fs = require('fs');

try {
  const output = execSync('curl -s http://localhost:3000/admin/posts/new').toString();
  fs.writeFileSync('curl_output.txt', output);
} catch(e) {
  fs.writeFileSync('curl_output.txt', e.toString());
}
