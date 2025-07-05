import { JFSDirectory } from "./JFSDirectory.js";
import { JFSFile, JFSType } from "./JFSFile.js";

export class JFSLink extends JFSFile {
	constructor(name: string, path: string, parent: JFSDirectory | null) {
		super(name, path, parent, JFSType.Link);
	}

	toString() { return this.getName() + ' -> ' + this.getContent(); }
}