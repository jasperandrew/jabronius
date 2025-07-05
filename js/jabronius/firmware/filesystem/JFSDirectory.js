import { jfsUpdated } from "../../../model/BrowserModel.js";
import { JFSFile, JFSType } from "./JFSFile.js";
export class JFSDirectory extends JFSFile {
    constructor(name, parent) {
        super(name, [], parent, JFSType.Directory);
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
    hasFile(name) {
        return this.getContent()
            .filter((f) => f.getName() === name)
            .length > 0;
    }
    addFile(file) {
        if (!file.getName())
            return; // invalid file
        if (this.hasFile(file.getName()))
            return; // file exists
        file.setParent(this);
        this.getContent().push(file);
        jfsUpdated();
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
        jfsUpdated();
    }
}
