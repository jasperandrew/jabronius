import { JFile, JFileType } from "./JFSFile";
export class JLink extends JFile {
    constructor(name, path, parent) {
        super(name, path, parent, JFileType.Link);
    }
    toString() { return this.getName() + ' -> ' + this.getContent(); }
}
