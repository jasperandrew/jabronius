import {JFile} from './JFile.mjs';

export class JLink extends JFile {
    constructor(name, path) {
        super(name, 'link', path);

        // Public Fields //////////////////
        this.toString = () => { return this.getName() + ' -> ' + this.getContent(); };
    }
}