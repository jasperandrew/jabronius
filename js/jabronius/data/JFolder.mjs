import {JFile} from './JFile.mjs';
import {JLink} from './JLink.mjs';
import {JLinkSelf} from './JLinkSelf.mjs';
import {JLinkParent} from './JLinkParent.mjs';

export class JFolder extends JFile {
    constructor(name) {
        super(name, 'fldr', {});

        // Public Methods /////////////////
        this.addFile = (f) => {
            this.getContent()[f.getName()] = f;
            f.setParent(this);
        };
        this.import = (arrJSON) => {
            arrJSON.forEach(f => {
                let tmp;
                switch(f.type){
                    case 'data': tmp = new JFile(f.name, f.type, f.data); break;
                    case 'link': tmp = new JLink(f.name, f.path); break;
                    case 'fldr':
                        tmp = new JFolder(f.name);
                        tmp.import(f.contents);
                }
                this.addFile(tmp);
            });
        };
        this.toString = (depth=0,i=0) => {
            if(depth === -1) depth = Infinity;
            let str = this.getName() + '/';
            if(depth === i) return str;
            const data = this.getContent();
            for(let d in data){
                str += `\n${'    '.repeat(i+1) + data[d].toString(depth,i+1)}`;
            }
            return str;
        };

        // Initialize /////////////////////
        this.addFile(new JLinkSelf());
        this.addFile(new JLinkParent());
    }
}