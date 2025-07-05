import { JFSFile, JFSType } from "./JFSFile.js";
export class JFSLink extends JFSFile {
    constructor(name, path, parent) {
        super(name, path, parent, JFSType.Link);
    }
    toString() { return this.getName() + ' -> ' + this.getContent(); }
}
