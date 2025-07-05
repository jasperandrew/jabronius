import { JFSDirectory } from "./JFSDirectory.js";
import { JFSRoot } from "./JFSRoot.js";
import { JFSFile, JFSType } from "./JFSFile.js";
import { JFSLink } from "./JFSLink.js";
import { Drive } from "../../hardware/Drive.js";
import { JFSData } from "./JFSData.js";

const DEFAULT_PATH_RESOLVE = true;
const DEFAULT_PATH_MKDIRS = false;
const DEFAULT_PATH_TOUCH = false;

interface ResolveConfig {
	resolve?: boolean;
	mkdirs?: boolean;
	touch?: boolean;
	type?: JFSType;
	parent?: JFSDirectory | null;
	name?: string;
}

interface JFileStruct {
	name: string;
	type: number;
	address: number;
	files?: JFileStruct[];
}

export class JFileSystem {
	private root: JFSRoot = new JFSRoot();

	constructor(
		private readonly drive: Drive
	) {
		drive.bindOnReady(() => this.readFromDisk());
		// this.root = this.readFromDisk();
		// console.log(this.root);
	}

	private writeToDisk = () => {
		this.drive.writeFileStructure(this.root);
	}

	private readFromDisk() {
		try {
			this.root = this.parseJFSDir(JSON.parse(this.drive.readFileStructure()));
		} catch (err) {
			console.error('JFS parse failed', err);
		}
	}

	private parseJFSDir(dirFiles: JFileStruct[], dir?: JFSDirectory) { // TODO: replace this whole system, eventually
		if (!dir) dir = new JFSRoot();

		dirFiles.forEach(f => {
			if (!f) {
				console.error('import file invalid');
				return;
			}
			let file;
			switch (f.type) {
				case JFSType.Data: {
					file = new JFSData(f.name, f.address, dir);
					break;
				}
				case JFSType.Directory: {
					if (!f.files) {
						console.error('dir files undefined');
						return;
					}
					file = this.parseJFSDir(f.files, new JFSDirectory(f.name, f.address, dir));
					break;
				}
				case JFSType.Link: {
					file = new JFSLink(f.name, f.address, dir);
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

	private resolveAbsolutePath(pathList: string[], config: any): JFSFile | null {
		return this.resolveRelativePath(this.root, pathList, config);
	}

	private resolveRelativePath(file: JFSFile | null, pathList: string[], config: ResolveConfig): JFSFile | null {
		let resolve = config.resolve ?? DEFAULT_PATH_RESOLVE,
			mkdirs = config.mkdirs ?? DEFAULT_PATH_MKDIRS,
			touch = config.touch ?? DEFAULT_PATH_TOUCH,
			type = config.type ?? JFSType.Data,
			parent = config.parent,
			name = config.name;

		if (!pathList.length) {
			if (resolve && file?.type === JFSType.Link)
				return this.resolvePathFromLink(file, [], config);

			if (touch && parent && name) {
				file = this.drive.createFile(name, type, parent);
				parent.addFile(file);
				this.writeToDisk();
			}
			return file;
		}

		switch (file?.type) {
			case JFSType.Directory: {
				return this.resolvePathFromFolder(file as JFSDirectory | null, pathList, config);
			}
			case JFSType.Link: {
				return this.resolvePathFromLink(file, pathList, config);
			}
			case JFSType.Data: {
				// todo: throw error?
				return null;
			}
		}

		if (mkdirs && parent && name) {
			let newDir = this.drive.createFile(name, JFSType.Directory, parent) as JFSDirectory;
			parent.addFile(newDir);
			this.writeToDisk();
			return this.resolvePathFromFolder(newDir, pathList, config);
		}

		return null;
	}

	private resolvePathFromFolder(dir: JFSDirectory | null, pathList: string[], config: any): JFSFile | null { // TODO: better null dir hancling?
		const next = pathList.shift();
		if (next === undefined) return dir;
		if (next === '.') {
			return this.resolvePathFromFolder(dir, pathList, config);
		}
		if (next === '..') {
			return this.resolvePathFromFolder(dir ? dir.parent : null, pathList, config);
		}
		let nextFile = dir?.files.filter((f: JFSFile) => f.name === next)[0];
		config.parent = dir;
		config.name = next;
		return this.resolveRelativePath(nextFile!!, pathList, config);
	}

	private resolvePathFromLink(link: JFSLink, pathList: string[], config: any): JFSFile | null {
		let newPath = this.readFile(link);
		if (!newPath) return null;
		if (pathList.length) newPath += '/' + pathList.join('/')
		return this.resolveAbsolutePath(this.getPathList(newPath), config);
	}

	getRoot() { return this.root; }

	getFile(filePath: string, config?: ResolveConfig): JFSFile | null {
		if (!config) config = {};
		return this.resolveAbsolutePath(this.getPathList(filePath), config);
	}

	getFilePath(file: JFSFile): string {
		if (file === this.root) return '/';
		const parent = file.parent;
		if (parent === null) return file.name;
		const parentName = this.getFilePath(parent);
		return parentName + (parentName === '/' ? '' : '/') + file.name;
	}

	createFile(filePath: string, fileType = JFSType.Data, mkdirs = true) {
		const file = this.resolveAbsolutePath(this.getPathList(filePath), {
			mkdirs: mkdirs,
			touch: true,
			type: fileType,
		});
		this.writeToDisk();
		return file;
	}

	removeFile(file: JFSFile) {
		file?.parent?.removeFile(file.name);
		this.writeToDisk();
	}

	readFile(file: JFSFile) {
		if (!file?.address) return null;
		const data = this.drive.readFile(file?.address);
		if (!data) return null;
		return data?.substring(data.indexOf('|') + 1);
	}
}