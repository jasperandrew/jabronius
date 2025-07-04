import { JFile, JFileType } from './JFile.js';
export class JDirectory extends JFile {
    constructor(name, parent) {
        super(name, [], parent, JFileType.Directory);
    }
    toString(depth = 0, i = 0) {
        if (depth === -1)
            depth = Infinity;
        let str = this.getName() + '/';
        if (depth === i)
            return str;
        const data = this.getContent();
        for (let d of data) {
            str += `\n${'    '.repeat(i + 1) + d.toString(depth, i + 1)}`;
        }
        return str;
    }
    addFile(file) {
        if (!file || !(file.getName())) {
            console.error('invalid file');
            return;
        }
        file.setParent(this);
        this.getContent().push(file);
    }
    removeFile(name) {
        if (!name)
            return;
        let f = this.getContent().filter((f) => f.getName() === name)[0];
        if (!f)
            return;
        f.setParent(undefined);
        let i = this.getContent().indexOf(f);
        this.getContent().splice(i, 1);
    }
}
