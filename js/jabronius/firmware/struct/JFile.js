export var JFileType;
(function (JFileType) {
    JFileType[JFileType["Data"] = 0] = "Data";
    JFileType[JFileType["Directory"] = 1] = "Directory";
    JFileType[JFileType["Link"] = 2] = "Link";
})(JFileType || (JFileType = {}));
export class JFile {
    name;
    content;
    parent;
    type;
    constructor(name, content, // TODO: restrict/codify data type?
    parent, type = JFileType.Data) {
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
