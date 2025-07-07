import { Memory } from "./Memory.js";

const DEFAULT_PATH_RESOLVE = true;
const DEFAULT_PATH_MKDIRS = false;
const DEFAULT_PATH_TOUCH = false;

interface ResolveConfig {
	resolve?: boolean;
	mkdirs?: boolean;
	touch?: boolean;
	type?: JFileType;
	parent?: JDirectory | null;
	name?: string;
}

interface FileModel {
	name: string;
	type: number;
	address: number;
	files?: FileModel[];
}

export class FileStructure {
	private root: JRoot = new JRoot();

	constructor(
		private readonly memory: Memory
	) {
		memory.driveReadyListeners.add(() => this.readFromDisk());
		// this.root = this.readFromDisk();
		// console.log(this.root);
	}

	private writeToDisk = () => {
		this.memory.writeFileStructure(this.root);
	}

	private readFromDisk() {
		try {
			this.root = this.parseJFSDir(JSON.parse(this.memory.readFileStructure()));
		} catch (err) {
			console.error('JFS parse failed', err);
		}
	}

	private parseJFSDir(dirFiles: FileModel[], dir?: JDirectory) {
		if (!dir) dir = new JRoot();

		dirFiles.forEach(f => {
			if (!f) {
				console.error('import file invalid');
				return;
			}
			let file;
			switch (f.type) {
				case JFileType.Data: {
					file = new JData(f.name, f.address, dir);
					break;
				}
				case JFileType.Directory: {
					if (!f.files) {
						console.error('dir files undefined');
						return;
					}
					file = this.parseJFSDir(f.files, new JDirectory(f.name, f.address, dir));
					break;
				}
				case JFileType.Link: {
					file = new JLink(f.name, f.address, dir);
					break;
				}
				default: return;
			}

			if (!dir) {
				console.error('dir undefined');
				return;
			}
			dir.addFile(file);
		});

		return dir;
	}

	private getPathList(path: string): string[] {
		if (!path) return [];
		let pathList = path.split('/');
		return pathList.filter(name => name);
	}

	private resolveAbsolutePath(pathList: string[], config: any): JFile | null {
		return this.resolveRelativePath(this.root, pathList, config);
	}

	private resolveRelativePath(file: JFile | null, pathList: string[], config: ResolveConfig): JFile | null {
		let resolve = config.resolve ?? DEFAULT_PATH_RESOLVE,
			mkdirs = config.mkdirs ?? DEFAULT_PATH_MKDIRS,
			touch = config.touch ?? DEFAULT_PATH_TOUCH,
			type = config.type ?? JFileType.Data,
			parent = config.parent,
			name = config.name;

		if (!pathList.length) {
			if (resolve && file?.type === JFileType.Link)
				return this.resolvePathFromLink(file, [], config);

			if (touch && parent && name) {
				file = this.memory.createFile(name, type, parent);
				parent.addFile(file);
				this.writeToDisk();
			}
			return file;
		}

		switch (file?.type) {
			case JFileType.Directory: {
				return this.resolvePathFromFolder(file as JDirectory | null, pathList, config);
			}
			case JFileType.Link: {
				return this.resolvePathFromLink(file, pathList, config);
			}
			case JFileType.Data: {
				// todo: throw error?
				return null;
			}
		}

		if (mkdirs && parent && name) {
			let newDir = this.memory.createFile(name, JFileType.Directory, parent) as JDirectory;
			parent.addFile(newDir);
			this.writeToDisk();
			return this.resolvePathFromFolder(newDir, pathList, config);
		}

		return null;
	}

	private resolvePathFromFolder(dir: JDirectory | null, pathList: string[], config: any): JFile | null { // TODO: better null dir hancling?
		const next = pathList.shift();
		if (next === undefined) return dir;
		if (next === '.') {
			return this.resolvePathFromFolder(dir, pathList, config);
		}
		if (next === '..') {
			return this.resolvePathFromFolder(dir ? dir.parent : null, pathList, config);
		}
		let nextFile = dir?.files.filter((f: JFile) => f.name === next)[0];
		config.parent = dir;
		config.name = next;
		return this.resolveRelativePath(nextFile!!, pathList, config);
	}

	private resolvePathFromLink(link: JLink, pathList: string[], config: any): JFile | null {
		let newPath = this.readFile(link);
		if (!newPath) return null;
		if (pathList.length) newPath += '/' + pathList.join('/')
		return this.resolveAbsolutePath(this.getPathList(newPath), config);
	}

	getRoot() { return this.root; }

	getFile(filePath: string, config?: ResolveConfig): JFile | null {
		if (!config) config = {};
		return this.resolveAbsolutePath(this.getPathList(filePath), config);
	}

	getFilePath(file: JFile): string {
		if (file === this.root) return '/';
		const parent = file.parent;
		if (parent === null) return file.name;
		const parentName = this.getFilePath(parent);
		return parentName + (parentName === '/' ? '' : '/') + file.name;
	}

	createFile(filePath: string, fileType = JFileType.Data, mkdirs = true) {
		const file = this.resolveAbsolutePath(this.getPathList(filePath), {
			mkdirs: mkdirs,
			touch: true,
			type: fileType,
		});
		this.writeToDisk();
		return file;
	}

	removeFile(file: JFile) {
		file?.parent?.removeFile(file.name);
		this.writeToDisk();
	}

	readFile(file: JFile) {
		if (!file?.address) return null;
		const data = this.memory.readFile(file?.address);
		if (!data) return null;
		return data?.substring(data.indexOf('|') + 1);
	}
}

export enum JFileType {
	Data, Directory, Link
}

export class JFile {
	constructor(
		public name: string,
		public type: JFileType = JFileType.Data,
		public address: number,
		public parent: JDirectory | null
	) {}
	
	toString() { return this.name; }
}

export class JDirectory extends JFile {
	public files: JFile[] = [];
	constructor(name: string, address: number, parent: JDirectory | null) {
		super(name, JFileType.Directory, address, parent);
	}

	toString(depth = 0, i = 0) {
		if (depth === -1) depth = Infinity;
		let str = this.name + '/';
		if (depth === i) return str;
		for (let f of this.files) {
			let s = f instanceof JDirectory ? f.toString(depth,i+1) : f.toString();
			str += `\n${'    '.repeat(i+1) + s}`;
		}
		return str;
	}

	hasFile(name: string) {
		return this.files
			.filter((f: JFile) => f.name === name)
			.length > 0;
	}

	addFile(file: JFile) {
		if (!file.name) return; // invalid file
		if (this.hasFile(file.name)) return; // file exists

		file.parent = this;
		this.files.push(file);
	}

	removeFile(name: string) {
		if (!this.hasFile(name)) return;
		let f = this.files.filter((f: JFile) => f.name === name)[0];
		f.parent = null;
		let i = this.files.indexOf(f);
		this.files.splice(i, 1);
	}
}

export class JData extends JFile {
   constructor(name: string, address: number, parent: JDirectory | null) {
      super(name, JFileType.Data, address, parent);
   }

	toString() { return `${this.name}*`; }
}

export class JLink extends JFile {
	constructor(name: string, address: number, parent: JDirectory | null) {
		super(name, JFileType.Link, address, parent);
	}

	toString() { return this.name + ' -> '; } // todo
}

export class JRoot extends JDirectory {
	constructor() {
		super('', 1, null);
	}
}