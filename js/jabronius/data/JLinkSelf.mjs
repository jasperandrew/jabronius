import {JLink} from './JLink.mjs';

export class JLinkSelf extends JLink {
    constructor() {
        super('.', null);

        // Public Fields //////////////////
        this.getContent = () => { return this.getParent().getPath(); };
        this.toString = () => { return this.getName(); };
    }
}