"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.Node = exports.QName = undefined;
exports._isNode = _isNode;
exports._isQName = _isQName;
exports.element = element;
exports.attribute = attribute;
exports.text = text;
exports.cdata = cdata;
exports.comment = comment;
exports.processingInstruction = processingInstruction;
exports.qname = qname;

var _xvseq = require("xvseq");

function _isNode(maybe) {
	return !!(maybe && maybe._isNode);
}

// go up the prototype chain to overwrite toString...
_xvseq.Seq.prototype.toString = function () {
	if (!this._isNode) return this.__toString("[", "]");
	return serialize(this);
};

class QName {
	constructor(uri, name) {
		this._isQName = true;
		this._name = name;
		this._uri = uri;
	}
}

exports.QName = QName;
function _isQName(maybe) {
	return !!(maybe && maybe._isQName);
}

class Node extends _xvseq.Seq {
	constructor(type, name, attrs, children) {
		if (_isNode(children)) {
			super([children]);
		} else if ((0, _xvseq._isSeq)(children)) {
			var a = children.toArray();
			if (type < 3) {
				a = a.map(_ => _isNode(_) ? _ : text(_));
			}
			super(a);
		} else if (children instanceof Array) {
			super(children);
		} else if (type == 1) {
			super([text(children)]);
		} else {
			// value
			super([children.toString()]);
		}
		this.forEach(function (_) {
			if (_isNode(_)) _._parent = this;
		}, this);
		this._name = name;
		this._attrs = attrs;
		this._isSeq = false;
		this._isNode = true;
		this._type = type;
		this._cache = {}; // for select by name
		this._owner = null; // TODO have elem create it, or explicitly through createDocument
		this._parent = null;
	}
}

exports.Node = Node;
_xvseq.Seq.prototype.push = function (v) {
	// allow mutative updates for XML parser
	this._array.push(v);
	this.size++;
};

_xvseq.Seq.prototype.name = function name() {
	var name = this._name;
	if (name instanceof QName) name = name._name;
	return name;
};

_xvseq.Seq.prototype.value = function value() {
	if (this._type == 1) return null;
	return this.first();
};
// children is a no-op because it's equal to the node

function serialize(node, indent) {
	indent = indent || 0;
	var type = node._type;
	var v;
	if (type < 3 || type == 7) {
		var name = node.name();
		if (type == 1) {
			var children = node;
			var ret = "";
			var attrs = "";
			var hasChildNodes = false;
			children.forEach(function (child, i) {
				var type = child._type;
				if (type == 2) {
					attrs += " " + serialize(child);
				} else {
					if (type == 1) hasChildNodes = hasChildNodes || true;
					ret += serialize(child, indent + 1);
				}
			});
			var dent = "";
			for (var i = 0; i < indent; i++) {
				dent += "\t";
			}
			return "\n" + dent + "<" + name + attrs + (ret === "" ? "/>" : ">") + ret + (ret === "" ? "" : (hasChildNodes ? "\n" + dent : "") + "</" + name + ">");
		} else if (type == 7) {
			v = node.value();
			return "<?" + name + " " + v.replace(/&/g, "&amp;") + "?>";
		} else {
			v = node.value();
			return name + "=\"" + v.replace(/&/g, "&amp;") + "\"";
		}
	} else if (type == 3 || type == 4 || type == 7 || type == 8) {
		v = node.value();
		if (type == 4) {
			return "<![CDATA[" + v + "]]>";
		} else if (type == 8) {
			return "<!--" + v + "-->";
		} else {
			return v.replace(/&/g, "&amp;");
		}
	} else {
		return "";
	}
}

function element($qname, ...$children) {
	return new Node(1, $qname, null, $children.length == 1 ? $children[0] : $children);
}

function attribute($qname, $value) {
	return new Node(2, $qname, null, $value);
}

function text($value) {
	return new Node(3, null, null, $value);
}

function cdata($value) {
	return new Node(4, null, null, $value);
}

function comment($value) {
	return new Node(8, null, null, $value);
}

function processingInstruction($name, $value) {
	return new Node(7, $name, null, $value);
}

function qname($uri, $name) {
	return new QName($uri, $name);
}