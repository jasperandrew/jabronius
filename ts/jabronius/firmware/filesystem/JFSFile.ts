import { JFSDirectory } from "./JFSDirectory.js";

export enum JFSType {
	Data, Directory, Link
}

export class JFSFile {
	constructor(
		public name: string,
		public type: JFSType = JFSType.Data,
		public address: number,
		public parent: JFSDirectory | null
	) {}
	
	toString() { return this.name; }
}