import { JFSFile, JFSType } from "./JFSFile.js";
export class JFSLink extends JFSFile {
    constructor(name, address, parent) {
        super(name, address, JFSType.Link, parent);
    }
    toString() { return this.name + ' -> '; } // todo
}
