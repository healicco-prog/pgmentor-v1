const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const regex = /req\.params\.userId/g;
const repl = "(req.params.userId === 'default' ? '00000000-0000-0000-0000-000000000000' : req.params.userId)";

content = content.replace(regex, repl);
fs.writeFileSync('server.ts', content);
console.log("Replaced req.params.userId with safe UUID parser in server.ts");
