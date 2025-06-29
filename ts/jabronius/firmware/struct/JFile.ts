import { JDirectory } from "./JDirectory.js";

export enum JFileType {
	Data, Directory, Link
}

export class JFile {
	constructor(
		private name: string,
		private content: any, // TODO: restrict/codify data type?
		private parent: JDirectory | null,
		private type: JFileType = JFileType.Data
	) {}
	
	getName() { return this.name; }
	getType() { return this.type; }
	getParent() { return this.parent; }
	getContent() { return this.content; }

	setName(s: string) { this.name = s; };
	setParent(f: JDirectory) { this.parent = f; };
	setContent(d: any) { this.content = d; };

	toString() { return `${this.name}*`; }
}