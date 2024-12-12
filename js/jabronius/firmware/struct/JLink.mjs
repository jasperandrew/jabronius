import { JFile, LNK } from './JFile.mjs';

export class JLink extends JFile {
    constructor(name, path) {
        super(name, path, LNK);

        // Public Fields //////////////////
        this.toString = () => this.getName() + ' -> ' + this.getContent();
    }
}