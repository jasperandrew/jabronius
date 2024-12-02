import { JFolder } from './JFolder.mjs';

export class JFolderRoot extends JFolder {
    constructor() {
        super();

        // Public Fields //////////////////
        this.isRoot = () => true;
        this.getName = () => '';
        this.getParent = () => null;
    }
}