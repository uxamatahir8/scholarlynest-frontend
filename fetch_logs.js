const fs = require('fs');
try {
  const content = fs.readFileSync('/home/scholarlynest-dev/.pm2/logs/dev-frontend-error.log', 'utf8');
  console.log(content.slice(-2000));
} catch(e) {
  console.error(e.message);
}
