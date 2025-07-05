import { JFSFile, JFSType } from "./JFSFile.js";
import { jfsUpdated } from "./JFileSystem.js";

export class JFSDirectory extends JFSFile {
	constructor(name: string, parent: JFSDirectory | null) {
		super(name, [], parent, JFSType.Directory);
	}

	toString(depth = 0, i = 0) {
		if (depth === -1) depth = Infinity;
		let str = this.getName() + '/';
		if (depth === i) return str;
		const data = this.getContent();
		for (let d of data) {
			str += `\n${'    '.repeat(i+1) + d.toString(depth,i+1)}`;
		}
		return str;
	}

	hasFile(name: string) {
		return this.getContent()
			.filter((f: JFSFile) => f.getName() === name)
			.length > 0;
	}

	addFile(file: JFSFile) {
		if (!file.getName()) return; // invalid file
		if (this.hasFile(file.getName())) return; // file exists

		file.setParent(this);
		this.getContent().push(file);
		jfsUpdated();
	}

	removeFile(name: string) {
		if (!name) return;
		let f = this.getContent().filter((f: JFSFile) => f.getName() === name)[0];
		if (!f) return;
		f.setParent(undefined);
		let i = this.getContent().indexOf(f);
		this.getContent().splice(i, 1);
		jfsUpdated();
	}
}