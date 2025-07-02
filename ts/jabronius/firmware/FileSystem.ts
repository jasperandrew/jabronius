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

export class FileSystem {
	private readonly root = new JDirectoryRoot();

	constructor() {
		this.import(this.root, FS_IMPORT);
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
		let nextFile = dir?.getContent()[next];
		config.parent = dir;
		config.name = next;
		return this.resolveRelativePath(nextFile, pathList, config);
	}

	private resolvePathFromLink(link: JLink, pathList: string[], config: any): JFile | null {
		let newPath = link.getContent();
		if (pathList.length) newPath += '/' + pathList.join('/')
		return this.resolveAbsolutePath(this.getPathList(newPath), config);
	}

	private import(dir: JDirectory, arrJSON: any[]) { // TODO: replace this whole system, eventually
		arrJSON.forEach(f => {
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
					this.import(file, content);
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
			console.error('dir contents invalid. making it a blank object.');
			dir.setContent({});
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
}

const FS_IMPORT = [
	{
		"type": 1,
		"name": "scr",
		"content": [
			{
				"type": 0,
				"name": "about",
				"content": `OUT('Hey, I\\'m Jasper. todo');`
			},
			{
				"type": 0,
				"name": "cat",
				"content": `
					const file = SHELL.resolveFile(ARGS[1]);
					if (!file) return;

					if (file.getType() === 1) {
						ERR(ARGS[1] + ': is a directory');
						return;
					}
					OUT(file.getContent());`
			},
			{
				"type": 0,
				"name": "contact",
				"content": `OUT('EMAIL: <a href="mailto:jasper.q.andrew@gmail.com">jasper.q.andrew@gmail.com</a>');`
			},
			{
				"type": 2,
				"name": "cv",
				"content": "/scr/resume"
			},
			{
				"type": 0,
				"name": "help",
				"content": `ERR(ARGS[0] + ': program not implemented');`
			},
			{
				"type": 0,
				"name": "resume",
				"content": `
					OUT('opening in new window...');
					window.setTimeout(() => { window.open('http://www.jasperandrew.me/resume.pdf'); }, 500);`
			},
			{
				"type": 0,
				"name": "welcome",
				"content": `
					OUT(
\`                         W E L C O M E   T O


          _       ____  _____   ____  _   _ _____ _    _  _____
         | |     |  _ \\\\|  __ \\\\ / __ \\\\| \\\\ | |_   _| |  | |/ ____|
         | | __ _| |_) | |__) | |  | |  \\\\| | | | | |  | | (___
     _   | |/ _\\\` |  _ <|  _  /| |  | | . \\\` | | | | |  | |\\\\___ \\\\
    | |__| | (_| | |_) | | \\\\ \\\\| |__| | |\\\\  |_| |_| |__| |____) |
     \\\\____/ \\\\__,_|____/|_|  \\\\_\\\\\\\\____/|_| \\\\_|_____|\\\\____/|_____/


                                 The
                           <b>Ja</b>vascript-<b>B</b>ased
              <b>R</b>eally <b>O</b>versimplified and <b>N</b>ot-very-useful
                      <b>I</b>mitation of a <b>U</b>nix <b>S</b>ystem



\`);`
			},
			{
				"type": 0,
				"name": "errtest",
				"content": `SHELL.nofunction();`
			},
			{
				"type": 0,
				"name": "ls",
				"content": `
					let path = ARGS[1] ?? '.';
					let dir = SHELL.resolveDir(path);
					if (!dir) return false;
					const list = dir.getContent();
					const names = Object.keys(list).map(name => list[name].toString());
					names.push('.');
					if (dir.getParent() !== null) names.push('..');
					OUT(names.toSorted((a,b) => a.localeCompare(b)).join('\\n'));`
			},
			{
				"type": 0,
				"name": "clear",
				"content": `SHELL.clearBuffer();`
			},
			{
				"type": 0,
				"name": "echo",
				"content": `
					ARGS.shift();
					OUT(ARGS.join(' '));`
			},
			{
				"type": 0,
				"name": "pwd",
				"content": `
					let dir = SHELL.resolveDir('.');
					if (!dir) return false;
					OUT(FS.getFilePath(dir));`
			},
			{
				"type": 0,
				"name": "touch",
				"content": `
					let path = ARGS[1];

					if (!path) {
						ERR('touch: path argument required');
						return false;
					}

					if (SHELL.resolveFile(path)) {
						ERR(\`\${path}: already exists\`);
						return false;
					}


					if (!path.startsWith('/')) {
						path = FS.getFilePath(SHELL.resolveDir('.')) + '/' + path;
					};

					return FS.createFile(path);`
			},
		]
	},
	{
		"type": 1,
		"name": "home",
		"content": [
			{
				"type": 1,
				"name": "jasper",
				"content": [
					{
						"type": 0,
						"name": "test",
						"content": "blah"
					},
					{
						"type": 2,
						"name": "lonk",
						"content": "/home/jasper/fodor/lunk"
					},
					{
						"type": 1,
						"name": "fodor",
						"content": [
							{
								"type": 0,
								"name": "toast",
								"content": "toasty"
							},
							{
								"type": 2,
								"name": "lunk",
								"content": "/home"
							}        
						]
					}        
				]
			}
		]
	}
];