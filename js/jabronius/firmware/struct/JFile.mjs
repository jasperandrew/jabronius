export class JFile {
	constructor(_name, _content, _type=REG) {
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

export const REG = 0;
export const DIR = 1;
export const LNK = 2;