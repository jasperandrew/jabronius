import { JFile, JFileType } from './JFile.js';
export class JLink extends JFile {
    constructor(name, path, parent) {
        super(name, path, parent, JFileType.Link);
    }
    toString() { return this.getName() + ' -> ' + this.getContent(); }
}
