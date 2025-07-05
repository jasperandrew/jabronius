import { JFSFile, JFSType } from "./JFSFile.js";
export class JFSLink extends JFSFile {
    constructor(name, address, parent) {
        super(name, JFSType.Link, address, parent);
    }
    toString() { return this.name + ' -> '; } // todo
}
