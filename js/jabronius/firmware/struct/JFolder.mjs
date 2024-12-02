import { FLDR, JFile } from './JFile.mjs';

export class JFolder extends JFile {
    constructor(name) {
        super(name, {}, FLDR);

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
    }
}