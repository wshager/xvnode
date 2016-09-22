var x = require("../lib/xvnode");

var node = x.element("root",[x.attribute("id","1"),x.text("test")]);
console.log(node);
