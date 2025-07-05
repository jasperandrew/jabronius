export var JFSType;
(function (JFSType) {
    JFSType[JFSType["Data"] = 0] = "Data";
    JFSType[JFSType["Directory"] = 1] = "Directory";
    JFSType[JFSType["Link"] = 2] = "Link";
})(JFSType || (JFSType = {}));
export class JFSFile {
    name;
    content;
    parent;
    type;
    constructor(name, content, // TODO: restrict/codify data type?
    parent, type = JFSType.Data) {
        this.name = name;
        this.content = content;
        this.parent = parent;
        this.type = type;
    }
    getName() { return this.name; }
    getType() { return this.type; }
    getParent() { return this.parent; }
    getContent() { return this.content; }
    setName(s) { this.name = s; }
    ;
    setParent(f) { this.parent = f; }
    ;
    setContent(d) { this.content = d; }
    ;
    toString() { return `${this.name}*`; }
}
