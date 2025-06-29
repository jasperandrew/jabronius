import { JFile, JFileType } from './JFile.js';

export class JDirectory extends JFile {
	constructor(name: string, parent: JDirectory | null) {
		super(name, {}, parent, JFileType.Directory);
	}

	toString(depth = 0, i = 0) {
		if (depth === -1) depth = Infinity;
		let str = this.getName() + '/';
		if (depth === i) return str;
		const data = this.getContent();
		for (let d in data) {
			str += `\n${'    '.repeat(i+1) + data[d].toString(depth,i+1)}`;
		}
		return str;
	}

	addFile(file: JFile) {
		if (!file || !(file.getName())) {
			console.error('invalid file');
			return;
		}

		file.setParent(this);
		this.getContent()[file.getName()] = file;
	}

	removeFile(name: string) {
		if (!name) return;
		this.getContent()[name]?.setParent(undefined);
		this.getContent()[name] = undefined;
	}
}