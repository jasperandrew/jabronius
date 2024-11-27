export class JFile {
    constructor(_name, _type, _content) {
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
        this.getPath = () => {
            let p = _parent,
                s = `/${_name}`;
            if(!p) return 'err';
            while(p.getType() !== 'fldr_root'){
                s = `/${p.getName() + s}`;
                p = p.getParent();
            }
            return s;
        };
    }
}