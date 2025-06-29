import { JDirectory } from './JDirectory.js';
import { JFile, JFileType } from './JFile.js';

export class JLink extends JFile {
	constructor(name: string, path: string, parent: JDirectory | null) {
		super(name, path, parent, JFileType.Link);
	}

	toString() { return this.getName() + ' -> ' + this.getContent(); }
}