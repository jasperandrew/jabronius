import {JLink} from './JLink.mjs';

export class JLinkParent extends JLink {
    constructor() {
        super('..', null);
    
        // Public Fields //////////////////
        this.getContent = () => { return this.getParent().getParent().getPath(); };
        this.toString = () => { return this.getName(); };
    }
}