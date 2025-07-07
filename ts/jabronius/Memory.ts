import { JFSData } from "./filesystem/JFSData.js";
import { JFSDirectory } from "./filesystem/JFSDirectory.js";
import { JFSFile, JFSType } from "./filesystem/JFSFile.js";
import { JFSLink } from "./filesystem/JFSLink.js";
import { JFSRoot } from "./filesystem/JFSRoot.js";

export type DriveReadyListener = () => void;
export type MemoryUpdatedListener = (memData: string) => void;

export class Memory {
	private data: string[] = [];

	readonly driveReadyListeners: Set<DriveReadyListener> = new Set();
	private fireDriveReady = () => this.driveReadyListeners.forEach((l: DriveReadyListener) => l());

	readonly memoryUpdatedListeners: Set<MemoryUpdatedListener> = new Set();
	private fireMemoryUpdated = () => this.memoryUpdatedListeners.forEach((l: MemoryUpdatedListener) => l(this.packDrive()));
	
	initMemory = (memData: string) => {
		this.unpackDrive(memData);
		this.fireDriveReady();
	}

	private unpackDrive(driveData: string) {
		this.data = driveData.split('\n').map((s: string) => decodeURIComponent(s));
	}

	private packDrive() {
		return this.data
			.map((s: string) => encodeURIComponent(s))
			.join('\n');
	}

	private isValidAddress = (addr: number) => addr > 1 && addr < this.data.length;
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
		this.fireMemoryUpdated();
	}

	readFileStructure() {
		return this.data[0];
	}

	createFile(name: string, type: JFSType, parent: JFSDirectory, content?: string): JFSFile {
		const address = this.data.length;
		let file: JFSFile;
		switch(type) {
			case JFSType.Data:      file = new JFSData(name, address, parent); break;
			case JFSType.Directory: file = new JFSDirectory(name, address, parent); break;
			case JFSType.Link:      file = new JFSLink(name, address, parent); break;
		}
		this.data.push(this.formatFileData(file, content));
		this.fireMemoryUpdated();
		return file;
	}

	writeFile(file: JFSFile, content?: string, append?: boolean): boolean {
		const addr = file.address;
		if (!this.isFileAddress(addr)) {
			console.error('not a valid file address: ' + addr)
			return false;
		}
		if (this.isDirAddress(addr)) {
			console.error('cannot write to directory address: ' + addr)
			return false;
		}

		content = content ?? '';
		if (append) {
			this.data[addr] += content;
			this.fireMemoryUpdated();
			return true;
		}
		this.data[addr] = this.formatFileData(file, content);
		this.fireMemoryUpdated();
		return true;
	}

	writeDirectory(dir: JFSDirectory): boolean {
		const addr = dir.address;
		if (!this.isDirAddress(addr)) {
			console.error('not a valid directory address: ' + addr)
			return false;
		}
		this.data[addr] = JFSType.Directory.toString()
				+ JSON.stringify(dir.files.map((f: JFSFile) => `${f.name}|${f.address}`));
		this.fireMemoryUpdated();
		return true;
	}

	readFile(addr: number): string | null {
		if (!this.isFileAddress(addr)) {
			console.error('not a valid file address: ' + addr)
			return null;
		}
		return this.data[addr]
	}

	shredFile(addr: number): boolean {
		if (!this.isFileAddress(addr)) {
			console.error('not a valid file address: ' + addr)
			return false;
		}
		this.data[addr] = '';
		this.fireMemoryUpdated();
		return true;
	}
}