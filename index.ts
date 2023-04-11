// you can use 'import' syntax!

import fs from "fs";

fs.writeFileSync("hello.txt", "Hello World!");
const res = fs.readFileSync("hello.txt", "utf8");

console.log(res);

fs.unlinkSync("hello.txt");
