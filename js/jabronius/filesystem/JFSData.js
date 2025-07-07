import { JFSFile, JFSType } from "./JFSFile.js";
export class JFSData extends JFSFile {
    constructor(name, address, parent) {
        super(name, JFSType.Data, address, parent);
    }
    toString() { return `${this.name}*`; }
}
