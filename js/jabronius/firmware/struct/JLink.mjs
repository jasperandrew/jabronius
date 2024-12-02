import { JFile, LINK } from './JFile.mjs';

export class JLink extends JFile {
    constructor(name, path) {
        super(name, path, LINK);

        // Public Fields //////////////////
        this.toString = () => this.getName() + ' -> ' + this.getContent();
    }
}