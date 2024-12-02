export class JFile {
    constructor(_name, _content, _type=DATA) {
        // Private Fields /////////////////
        let _parent = null;

        // Public Fields //////////////////
        this.getName = () => _name;
        this.getType = () => _type;
        this.getParent = () => _parent;
        this.getContent = () => _content;

        this.setName = (s) => { _name = s; };
        this.setParent = (f) => {  _parent = f; };
        this.setContent = (d) => { _content = d; };

        this.toString = () => `${_name}*`;
    }
}

export const FLDR = '<<folder>>';
export const DATA = '<<data>>';
export const LINK = '<<link>>';