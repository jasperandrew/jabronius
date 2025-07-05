import { JFSDirectory } from "./JFSDirectory.js";

export enum JFSType {
	Data, Directory, Link
}

export class JFSFile {
	constructor(
		private name: string,
		private content: any, // TODO: restrict/codify data type?
		private parent: JFSDirectory | null,
		private type: JFSType = JFSType.Data
	) {}
	
	getName() { return this.name; }
	getType() { return this.type; }
	getParent() { return this.parent; }
	getContent() { return this.content; }

	setName(s: string) { this.name = s; };
	setParent(f: JFSDirectory) { this.parent = f; };
	setContent(d: any) { this.content = d; };

	toString() { return `${this.name}*`; }
}