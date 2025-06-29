import { JFile, JFileType } from './struct/JFile.js';
import { JDirectory } from './struct/JDirectory.js';
import { JDirectoryRoot } from './struct/JDirectoryRoot.js';
import { JLink } from './struct/JLink.js';
const DEFAULT_PATH_RESOLVE = true;
const DEFAULT_PATH_MKDIRS = false;
const DEFAULT_PATH_TOUCH = false;
export class FileSystem {
    root = new JDirectoryRoot();
    constructor() {
        this.import(this.root, FS_IMPORT);
    }
    getPathList(path) {
        if (!path)
            return [];
        let pathList = path.split('/');
        return pathList.filter(name => name);
    }
    resolveAbsolutePath(pathList, config) {
        return this.resolveRelativePath(this.root, pathList, config);
    }
    resolveRelativePath(file, pathList, config) {
        let resolve = config.resolve ?? DEFAULT_PATH_RESOLVE, mkdirs = config.mkdirs ?? DEFAULT_PATH_MKDIRS, touch = config.touch ?? DEFAULT_PATH_TOUCH, type = config.type ?? JFileType.Data, parent = config.parent, name = config.name;
        if (!pathList.length) {
            if (resolve && file?.getType() === JFileType.Link)
                return this.resolvePathFromLink(file, [], config);
            if (touch && parent && name) {
                switch (type) {
                    case JFileType.Data:
                        file = new JFile(name, null, parent);
                        break;
                    case JFileType.Directory:
                        file = new JDirectory(name, parent);
                        break;
                    case JFileType.Link:
                        file = new JLink(name, '.', parent);
                        break;
                }
                parent.addFile(file);
            }
            return file;
        }
        switch (file?.getType()) {
            case JFileType.Directory: {
                return this.resolvePathFromFolder(file, pathList, config);
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
    resolvePathFromFolder(dir, pathList, config) {
        const next = pathList.shift();
        if (next === undefined)
            return dir;
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
    resolvePathFromLink(link, pathList, config) {
        let newPath = link.getContent();
        if (pathList.length)
            newPath += '/' + pathList.join('/');
        return this.resolveAbsolutePath(this.getPathList(newPath), config);
    }
    import(dir, arrJSON) {
        arrJSON.forEach(f => {
            if (!f) {
                console.error('import file invalid');
                return;
            }
            const name = f['name'], type = f['type'], content = f['content'];
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
    addSubFile(dir, file) {
        if (!dir) {
            console.error('invalid dir');
            return;
        }
        if (typeof (dir.getContent()) !== 'object') {
            console.error('dir contents invalid. making it a blank object.');
            dir.setContent({});
        }
        dir.addFile(file);
    }
    getRootDir() { return this.root; }
    getFileFromPath(path, config) {
        return this.resolveAbsolutePath(this.getPathList(path), config);
    }
    getPath(file) {
        if (file === this.root)
            return '/';
        const parent = file.getParent();
        if (parent === null)
            return file.getName();
        const parentName = this.getPath(parent);
        return parentName + (parentName === '/' ? '' : '/') + file.getName();
    }
    createFile(path, type = JFileType.Data, mkdirs = true) {
        return this.resolveAbsolutePath(this.getPathList(path), {
            mkdirs: mkdirs,
            touch: true,
            type: type,
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
