import { DIR, JFile } from './JFile.mjs';

export class JDirectory extends JFile {
    constructor(name) {
        super(name, {}, DIR);

        // Public Methods /////////////////
        this.isRoot = () => false;
        this.toString = (depth=0,i=0) => {
            if (depth === -1) depth = Infinity;
            let str = this.getName() + '/';
            if (depth === i) return str;
            const data = this.getContent();
            for (let d in data) {
                str += `\n${'    '.repeat(i+1) + data[d].toString(depth,i+1)}`;
            }
            return str;
        };

        this.addFile = (file) => {
            if (!file || !(file.getName())) {
                console.error('invalid file');
                return;
            }

            file.setParent(this);
            this.getContent()[file.getName()] = file;
        }

        this.removeFile = (name) => {
            if (!name) return;
            this.getContent()[name]?.setParent(undefined);
            this.getContent()[name] = undefined;
        }
    }
}