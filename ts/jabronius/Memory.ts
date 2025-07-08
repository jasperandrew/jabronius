import { JData, JDirectory, JFile, JLink, JRoot, JFileType } from "./FileStructure.js";

export type MemoryReadyListener = () => void;
export type MemoryUpdatedListener = (memData: string) => void;

export class Memory {
	private memory: string[] = [];

	readonly memoryReadyListeners: Set<MemoryReadyListener> = new Set();
	private fireMemoryReady = () => this.memoryReadyListeners.forEach((l: MemoryReadyListener) => l());

	readonly memoryUpdatedListeners: Set<MemoryUpdatedListener> = new Set();
	private fireMemoryUpdated = () => this.memoryUpdatedListeners.forEach((l: MemoryUpdatedListener) => l(this.packMemory()));
	
	initMemory = (memoryStr: string) => {
		this.unpackMemory(memoryStr);
		this.fireMemoryReady();
	}

	private unpackMemory(memoryStr: string) {
		this.memory = memoryStr.split('\n').map((s: string) => decodeB64(s));
	}

	private packMemory() {
		return this.memory
			.map((s: string) => encodeB64(s))
			.join('\n');
	}

	private isValidAddress = (addr: number) => addr > 1 && addr < this.memory.length;
	private isFileAddress = (addr: number) => this.isValidAddress(addr) && this.memory[addr] && this.memory[addr] !== '';
	private isDirAddress = (addr: number) => this.isFileAddress(addr) && this.memory[addr][0] === '1';

	private formatDirData = (files: JFile[]) => files.map(f => `${f.name}/${f.address}`).join('|');
	private formatFileData(file: JFile, content?: string) {
		if (file instanceof JDirectory) content = this.formatDirData(file.files);
		return `${file.type}${file.name}|${content ?? ''}`;
	}

	writeFileStructure(root: JRoot) {
		this.memory[0] = JSON.stringify(
				root.files,
				(k, v) => k === 'parent' ? undefined : v);
		
		this.memory[1] = this.formatDirData(root.files);
		this.fireMemoryUpdated();
	}

	readFileStructure() {
		return this.memory[0];
	}

	createFile(name: string, type: JFileType, parent: JDirectory, content?: string): JFile {
		const address = this.memory.length;
		let file: JFile;
		switch(type) {
			case JFileType.Data:      file = new JData(name, address, parent); break;
			case JFileType.Directory: file = new JDirectory(name, address, parent); break;
			case JFileType.Link:      file = new JLink(name, address, parent); break;
		}
		this.memory.push(this.formatFileData(file, content));
		this.fireMemoryUpdated();
		return file;
	}

	writeFile(file: JFile, content?: string, append?: boolean): boolean {
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
			this.memory[addr] += content;
			this.fireMemoryUpdated();
			return true;
		}
		this.memory[addr] = this.formatFileData(file, content);
		this.fireMemoryUpdated();
		return true;
	}

	writeDirectory(dir: JDirectory): boolean {
		const addr = dir.address;
		if (!this.isDirAddress(addr)) {
			console.error('not a valid directory address: ' + addr)
			return false;
		}
		this.memory[addr] = JFileType.Directory.toString()
				+ JSON.stringify(dir.files.map((f: JFile) => `${f.name}|${f.address}`));
		this.fireMemoryUpdated();
		return true;
	}

	readFile(addr: number): string | null {
		if (!this.isFileAddress(addr)) {
			console.error('not a valid file address: ' + addr)
			return null;
		}
		return this.memory[addr]
	}

	shredFile(addr: number): boolean {
		if (!this.isFileAddress(addr)) {
			console.error('not a valid file address: ' + addr)
			return false;
		}
		this.memory[addr] = '';
		this.fireMemoryUpdated();
		return true;
	}
}