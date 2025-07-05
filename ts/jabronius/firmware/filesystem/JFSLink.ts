import { JFSDirectory } from "./JFSDirectory.js";
import { JFSFile, JFSType } from "./JFSFile.js";

export class JFSLink extends JFSFile {
	constructor(name: string, address: number, parent: JFSDirectory | null) {
		super(name, JFSType.Link, address, parent);
	}

	toString() { return this.name + ' -> '; } // todo
}