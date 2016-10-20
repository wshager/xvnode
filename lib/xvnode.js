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

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _isNode(maybe) {
	return !!(maybe && maybe._isNode);
}

// go up the prototype chain to overwrite toString...
_xvseq.Seq.prototype.toString = function () {
	if (!_isNode(this)) return this.__toString("[", "]");
	return serialize(this);
};

var QName = exports.QName = function QName(uri, name) {
	_classCallCheck(this, QName);

	this._isQName = true;
	this._name = name;
	this._uri = uri;
};

function _isQName(maybe) {
	return !!(maybe && maybe._isQName);
}

var Node = exports.Node = function (_Seq) {
	_inherits(Node, _Seq);

	function Node(type, name, attrs, children) {
		_classCallCheck(this, Node);

		if (_isNode(children)) {
			var _this = _possibleConstructorReturn(this, (Node.__proto__ || Object.getPrototypeOf(Node)).call(this, [children]));
		} else if ((0, _xvseq._isSeq)(children)) {
			var _this = _possibleConstructorReturn(this, (Node.__proto__ || Object.getPrototypeOf(Node)).call(this, children.toArray()));
		} else if (children instanceof Array) {
			var _this = _possibleConstructorReturn(this, (Node.__proto__ || Object.getPrototypeOf(Node)).call(this, children));
		} else if (type == 1) {
			var _this = _possibleConstructorReturn(this, (Node.__proto__ || Object.getPrototypeOf(Node)).call(this, [text(children)]));
		} else {
			var _this = _possibleConstructorReturn(this, (Node.__proto__ || Object.getPrototypeOf(Node)).call(this, [children.toString()]));
			// value

		}
		_this.forEach(function (_) {
			if (_isNode(_)) _._parent = this;
		}, _this);
		_this._name = name;
		_this._attrs = attrs;
		_this._isSeq = false;
		_this._isNode = true;
		_this._type = type;
		_this._cache = {}; // for select by name
		_this._owner = null; // TODO have elem create it, or explicitly through createDocument
		_this._parent = null;
		return _possibleConstructorReturn(_this);
	}

	return Node;
}(_xvseq.Seq);

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

function element($qname) {
	for (var _len = arguments.length, $children = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
		$children[_key - 1] = arguments[_key];
	}

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
