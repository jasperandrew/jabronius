import { JFile, JFileType } from './struct/JFile.js';
import { JDirectory } from './struct/JDirectory.js';
import { JDirectoryRoot } from './struct/JDirectoryRoot.js';
import { JLink } from './struct/JLink.js';

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

let jfsUpdateCallback: Function | null = null;
export function jfsUpdated() {
	jfsUpdateCallback?.call(null);
}

export class FileSystem {
	private readonly root = new JDirectoryRoot();

	constructor() {
		jfsUpdateCallback = this.jfsUpdated;

		let JFS_JSON = localStorage.getItem('jfs_json');
		if (JFS_JSON) {
			try {
				this.importDir(this.root, JSON.parse(JFS_JSON));
			} catch(err) {
				console.log('local JFS import failed', err);
				JFS_JSON = null;
			}
		}
		if (!JFS_JSON) {
			this.importDir(this.root, JFS_ROOT);
			this.jfsUpdated();
		}
	}

	private jfsUpdated = () => {
		localStorage.setItem(
			'jfs_json',
			JSON.stringify(
				this.root.getContent(),
				(k,v) => k === 'parent' ? undefined : v)
		);
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
			if (resolve && file?.getType() === JFileType.Link)
				return this.resolvePathFromLink(file, [], config);

			if (touch && parent && name) {
				switch (type) {
					case JFileType.Data: file = new JFile(name, null, parent); break;
					case JFileType.Directory: file = new JDirectory(name, parent); break;
					case JFileType.Link: file = new JLink(name, '.', parent); break;
				}
				parent.addFile(file);
			}
			return file;
		}

		switch (file?.getType()) {
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
			let newDir = new JDirectory(name, parent);
			parent.addFile(newDir);
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
			return this.resolvePathFromFolder(dir ? dir.getParent() : null, pathList, config);
		}
		let nextFile = dir?.getContent().filter((f: JFile) => f.getName() === next)[0];
		config.parent = dir;
		config.name = next;
		return this.resolveRelativePath(nextFile, pathList, config);
	}

	private resolvePathFromLink(link: JLink, pathList: string[], config: any): JFile | null {
		let newPath = link.getContent();
		if (pathList.length) newPath += '/' + pathList.join('/')
		return this.resolveAbsolutePath(this.getPathList(newPath), config);
	}

	private importDir(dir: JDirectory, dirObj: any[]) { // TODO: replace this whole system, eventually
		dirObj.forEach(f => {
			if (!f) {
				console.error('import file invalid');
				return;
			}
			const name = f['name'],
				type = f['type'],
				content = f['content'];
			let file;
			switch (type) {
				case JFileType.Data: {
					file = new JFile(name, content, dir);
					break;
				}
				case JFileType.Directory: {
					file = new JDirectory(name, dir);
					this.importDir(file, content);
					break;
				}
				case JFileType.Link: {
					file = new JLink(name, content, dir);
					break;
				}
				default: return;
			}
			this.addSubFile(dir, file);
		});
	}

	private addSubFile(dir: JDirectory, file: JFile) {
		if (!dir) {
			console.error('invalid dir');
			return;
		}
		if (typeof(dir.getContent()) !== 'object') {
			console.error('dir contents invalid. making it a blank array.');
			dir.setContent([]);
		}
		dir.addFile(file);
	}

	getRoot() { return this.root; }

	getFile(filePath: string, config?: ResolveConfig): JFile | null {
		if (!config) config = {};
		return this.resolveAbsolutePath(this.getPathList(filePath), config);
	}

	getFilePath(file: JFile): string {
		if (file === this.root) return '/';
		const parent = file.getParent();
		if (parent === null) return file.getName();
		const parentName = this.getFilePath(parent);
		return parentName + (parentName === '/' ? '' : '/') + file.getName();
	}

	createFile(filePath: string, fileType = JFileType.Data, mkdirs = true) {
		return this.resolveAbsolutePath(this.getPathList(filePath), {
			mkdirs: mkdirs,
			touch: true,
			type: fileType,
		});
	}

	removeFile(file: JFile) {
		file?.getParent()?.removeFile(file.getName());
	}
}