import { JFSFile, JFSType } from "./JFSFile.js";

export class JFSDirectory extends JFSFile {
	public files: JFSFile[] = [];
	constructor(name: string, address: number, parent: JFSDirectory | null) {
		super(name, JFSType.Directory, address, parent);
	}

	toString(depth = 0, i = 0) {
		if (depth === -1) depth = Infinity;
		let str = this.name + '/';
		if (depth === i) return str;
		for (let f of this.files) {
			let s = f instanceof JFSDirectory ? f.toString(depth,i+1) : f.toString();
			str += `\n${'    '.repeat(i+1) + s}`;
		}
		return str;
	}

	hasFile(name: string) {
		return this.files
			.filter((f: JFSFile) => f.name === name)
			.length > 0;
	}

	addFile(file: JFSFile) {
		if (!file.name) return; // invalid file
		if (this.hasFile(file.name)) return; // file exists

		file.parent = this;
		this.files.push(file);
		// jfsUpdated();
	}

	removeFile(name: string) {
		if (!this.hasFile(name)) return;
		let f = this.files.filter((f: JFSFile) => f.name === name)[0];
		f.parent = null;
		let i = this.files.indexOf(f);
		this.files.splice(i, 1);
		// jfsUpdated();
	}
}