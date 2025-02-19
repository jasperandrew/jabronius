import { REG, DIR, JFile, LNK } from './struct/JFile.mjs';
import { JDirectory } from './struct/JDirectory.mjs';
import { JDirectoryRoot } from './struct/JDirectoryRoot.mjs';
import { JLink } from './struct/JLink.mjs';

const DEF_PATH_RESOLVE = true;
const DEF_PATH_MKDIRS = false;
const DEF_PATH_TOUCH = false;

export class FileSystem {
	constructor() {

		////// Private Fields /////////////////

		const _root = new JDirectoryRoot();

		const _getPathList = (path) => {
			if (!path) return null;
			let pathList = path.split('/');
			return pathList.filter(name => name);
		}

		const _resolveAbsolutePath = (pathList, config) => {
			return _resolveRelativePath(_root, pathList, config);
		}

		const _resolveRelativePath = (file, pathList, config) => {
			if (!config) config = {};
			let resolve = config.resolve ?? DEF_PATH_RESOLVE,
				mkdirs = config.mkdirs ?? DEF_PATH_MKDIRS,
				touch = config.touch ?? DEF_PATH_TOUCH,
				type = config.filetype ?? REG,
				parent = config.parent,
				name = config.name;
			
			if (!pathList?.length) {
				if (resolve && file?.getType() === LNK)
					return _resolvePathFromLink(file, null, config);

				if (touch && parent && name) {
					switch (type) {
						case REG: file = new JFile(name); break;
						case DIR: file = new JDirectory(name); break;
						case LNK: file = new JLink(name); break;
						default: return null;
					}
					parent.addFile(file);
				}
				return file;
			}

			switch (file?.getType()) {
				case DIR: {
					return _resolvePathFromFolder(file, pathList, config);
				}
				case LNK: {
					return _resolvePathFromLink(file, pathList, config);
				}
				case REG: {
					// todo: throw error?
					return null;
				}
			}

			if (mkdirs && parent && name) {
				let newDir = new JDirectory(name);
				parent.addFile(newDir);
				return _resolvePathFromFolder(newDir, pathList, config);
			}

			return null;
		}

		const _resolvePathFromFolder = (dir, pathList, config) => {
			if (!pathList?.length) return dir;
			const next = pathList.shift();
			if (next === '.') {
				return _resolvePathFromFolder(dir, pathList, config);
			}
			if (next === '..') {
				return _resolvePathFromFolder(dir.getParent(), pathList, config);
			}
			let nextFile = dir.getContent()[next];
			config.parent = dir;
			config.name = next;
			return _resolveRelativePath(nextFile, pathList, config);
		}

		const _resolvePathFromLink = (link, pathList, config) => {
			let newPath = link.getContent();
			if (pathList?.length) newPath += '/' + pathList.join('/')
			return _resolveAbsolutePath(_getPathList(newPath), config);
		}

		const _import = (dir, arrJSON) => {
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
					case REG: {
						file = new JFile(name, content);
						break;
					}
					case DIR: {
						file = new JDirectory(name);
						_import(file, content);
						break;
					}
					case LNK: {
						file = new JLink(name, content);
						break;
					}
					default:
				}
				return _addSubFile(dir, file);
			});
		}

		const _addSubFile = (dir, file) => {
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


		////// Public Fields //////////////////

		this.getRootDir = () => _root;

		this.getFileFromPath = (path, config) => {
			return _resolveAbsolutePath(_getPathList(path), config);
		}

		this.getPath = (file) => {
			if (!file) return '<<err>>';
			if (file === _root) return '/';
			const parentName = this.getPath(file.getParent());
			return parentName + (parentName === '/' ? '' : '/') + file.getName();
		}

		this.createFile = (path, type=REG, mkdirs=true) => {
			return _resolveAbsolutePath(_getPathList(path), {
				mkdirs: mkdirs,
				touch: true,
				type: type,
			});
		}


		////// Initialize /////////////////////

		_import(_root, FS_IMPORT);
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
				"content": `const file = SHELL.resolveFile(ARGS[1]);
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
				"content": `OUT('opening in new window...');
window.setTimeout(() => { window.open('http://www.jasperandrew.me/resume.pdf'); }, 500);`
			},
			{
				"type": 0,
				"name": "welcome",
				"content": `OUT(
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