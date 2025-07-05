import { JFSData } from "../firmware/filesystem/JFSData.js";
import { JFSDirectory } from "../firmware/filesystem/JFSDirectory.js";
import { JFSFile, JFSType } from "../firmware/filesystem/JFSFile.js";
import { JFSLink } from "../firmware/filesystem/JFSLink.js";
import { JFSRoot } from "../firmware/filesystem/JFSRoot.js";

export class Drive {
	private readonly data = DRIVE_DATA.split('\n').map((s: string) => decodeURIComponent(s));
	
	constructor() {
		console.log(this.data);
	}

	private isValidAddress = (addr: number) => addr >= 1 && addr < this.data.length;
	private isFileAddress = (addr: number) => this.isValidAddress(addr) && this.data[addr] && this.data[addr] !== '';
	private isDirAddress = (addr: number) => this.isFileAddress(addr) && this.data[addr][0] === '1';

	private formatDirData = (files: JFSFile[]) => files.map(f => `${f.name}/${f.address}`).join('|');
	private formatFileData(file: JFSFile, content?: string) {
		if (file instanceof JFSDirectory) content = this.formatDirData(file.files);
		return `${file.type}${file.name}|${content ?? ''}`;
	}

	writeFileStructure(root: JFSRoot) {
		this.data[0] = JSON.stringify(
				root.files,
				(k, v) => k === 'parent' ? undefined : v);
		
		this.data[1] = this.formatDirData(root.files);
	}

	readFileStructure() {
		return this.data[0];
	}

	createFile(name: string, type: JFSType, parent: JFSDirectory, content?: string): JFSFile {
		const address = this.data.length;
		this.data.push(type.valueOf().toString() + (content ?? ''));
		switch(type) {
			case JFSType.Data:      return new JFSData(name, address, parent);
			case JFSType.Directory: return new JFSDirectory(name, address, parent);
			case JFSType.Link:      return new JFSLink(name, address, parent);
		}
	}

	writeFile(file: JFSFile, content?: string, append?: boolean): boolean {
		const addr = file.address;
		if (!this.isFileAddress(addr)) {
			console.log('not a valid file address: ' + addr)
			return false;
		}
		if (this.isDirAddress(addr)) {
			console.log('cannot write to directory address: ' + addr)
			return false;
		}

		content = content ?? '';
		if (append) {
			this.data[addr] += content;
			return true;
		}
		this.data[addr] = this.formatFileData(file, content);
		return true;
	}

	writeDirectory(dir: JFSDirectory): boolean {
		const addr = dir.address;
		if (!this.isDirAddress(addr)) {
			console.log('not a valid directory address: ' + addr)
			return false;
		}
		this.data[addr] = JFSType.Directory.toString()
				+ JSON.stringify(dir.files.map((f: JFSFile) => `${f.name}|${f.address}`));
		return true;
	}

	readFile(addr: number): string | null {
		if (!this.isFileAddress(addr)) {
			console.log('not a valid file address: ' + addr)
			return null;
		}
		return this.data[addr]
	}

	shredFile(addr: number): boolean {
		if (!this.isFileAddress(addr)) {
			console.log('not a valid file address: ' + addr)
			return false;
		}
		this.data[addr] = '';
		return true;
	}
}