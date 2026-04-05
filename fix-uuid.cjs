const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const regex1 = /user_id\s*\|\|\s*'default'/g;
const repl1 = "(user_id === 'default' || !user_id ? '00000000-0000-0000-0000-000000000000' : user_id)";

const regex2 = /userId\s*\|\|\s*'default'/g;
const repl2 = "(userId === 'default' || !userId ? '00000000-0000-0000-0000-000000000000' : userId)";

content = content.replace(regex1, repl1);
content = content.replace(regex2, repl2);

// Also replace the console.log string where it is printed directly
content = content.replace(/\$\{user_id \|\| 'default'\}/g, "${user_id === 'default' || !user_id ? '00000000-0000-0000-0000-000000000000' : user_id}");

fs.writeFileSync('server.ts', content);
console.log("Replaced user_id || 'default' with valid UUID in server.ts");
