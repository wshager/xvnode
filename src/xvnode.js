import { Seq } from 'immutable';

export function isNode(maybe){
	return !!(maybe && maybe._isNode);
}

// go up the prototype chain to overwrite toString...
Seq.prototype.constructor.Indexed.prototype.toString = function(){
	if(!this._isNode) return this.__toString("[","]");
	return serialize(this);
};

export class QName {
	constructor(uri,name){
        this._isQName = true;
		this._name = name;
        this._uri = uri;
	}
}

export class Node extends Seq {
	constructor(type, name, attrs, children) {
		super(Seq.isSeq(children) ? children.toArray() : children instanceof Array ? children : [children]);
		this.forEach(function(_) {
			if (isNode(_)) _._parent = this;
		},this);
		this._name = name;
		this._attrs = attrs;
		this._isNode = true;
		this._type = type;
		this._cache = {}; // for select by name
		this._owner = null; // TODO have elem create it, or explicitly through createDocument
		this._parent = null;
	}
}

Seq.prototype.push = function(v){
	// allow mutative updates for XML parser
	this._array.push(v);
	this.size++;
};

Seq.prototype.name = function name(){
    var name = this._name;
    if(name instanceof QName) name = name._name;
    return name;
};

Seq.prototype.value = function value(){
    if(this._type ==  1) return null;
    return this.first();
};
// children is a no-op because it's equal to the node

function serialize(node,indent) {
	indent = indent || 0;
	var type = node._type;
    var v;
	if(type<3 || type == 7){
		var name = node.name();
		if(type==1){
			var children = node;
			var ret = "";
			var attrs = "";
			var hasChildNodes = false;
			children.forEach(function(child,i){
				var type = child._type;
				if(type == 2){
					attrs += " "+serialize(child);
				} else {
					if(type == 1) hasChildNodes = hasChildNodes || true;
					ret += serialize(child,indent+1);
				}
			});
			var dent = "";
			for(var i = 0; i < indent; i++){
				dent += "\t";
			}
			return "\n"+dent+"<"+name+attrs+(ret==="" ? "/>" : ">")+ret+(ret==="" ? "" : (hasChildNodes ? "\n"+dent : "")+"</"+name+">");
		} else if(type == 7){
            v = node.value();
			return "<?"+name+" "+v.replace(/&/g,"&amp;")+"?>";
		} else {
            v = node.value();
			return name+"=\""+v.replace(/&/g,"&amp;")+"\"";
        }
    } else if (type == 3 || type == 4 || type == 7 || type == 8) {
        v = node.value();
        if(type == 4){
            return "<![CDATA["+v+"]]>";
        } else if(type == 8){
            return "<!--"+v+"-->";
        } else {
            return v.replace(/&/g, "&amp;");
        }
	} else {
		return "";
	}
}

export function element($qname, $children) {
	return new Node(1, $qname, null, $children);
}

export function attribute($qname, $value) {
	return new Node(2, $qname, null, $value);
}

export function text($value) {
	return new Node(3, null, null, $value);
}

export function cdata($value) {
	return new Node(4, null, null, $value);
}

export function comment($value) {
	return new Node(8, null, null, $value);
}

export function processingInstruction($name, $value) {
	return new Node(7, $name, null, $value);
}

export function qname($uri, $name) {
    return new QName($uri, $name);
}
