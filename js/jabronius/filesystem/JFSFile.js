export var JFSType;
(function (JFSType) {
    JFSType[JFSType["Data"] = 0] = "Data";
    JFSType[JFSType["Directory"] = 1] = "Directory";
    JFSType[JFSType["Link"] = 2] = "Link";
})(JFSType || (JFSType = {}));
export class JFSFile {
    name;
    type;
    address;
    parent;
    constructor(name, type = JFSType.Data, address, parent) {
        this.name = name;
        this.type = type;
        this.address = address;
        this.parent = parent;
    }
    toString() { return this.name; }
}
