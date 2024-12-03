import { DATA, FLDR, JFile, LINK } from './struct/JFile.mjs';
import { JFolder } from './struct/JFolder.mjs';
import { JFolderRoot } from './struct/JFolderRoot.mjs';
import { JLink } from './struct/JLink.mjs';

export class FileSystem {
    constructor() {

        ////// Private Fields /////////////////

        let _root = new JFolderRoot();
        
        const _getFileWithRelPath = (file, pathList, resolve) => {
            if (!pathList?.length) {
                if (resolve && file?.getType() === LINK)
                    return _getFileFromLink(file, null, true);
                return file;
            }
            if (!pathList[0]) {
                pathList.shift();
                return _getFileWithRelPath(file, pathList, resolve);
            }
            switch (file?.getType()) {
                case FLDR: {
                    return _getFileFromFolder(file, pathList, resolve);
                }
                case LINK: {
                    return _getFileFromLink(file, pathList, resolve);
                }
                case DATA:
                default:
                    return null;
            }
        };

        const _getFileFromFolder = (folder, pathList, resolve) => {
            if (!pathList?.length) return folder;
            const next = pathList.shift();
            if (next === '.') {
                return _getFileFromFolder(folder, pathList, resolve);
            }
            if (next === '..') {
                return _getFileFromFolder(folder.getParent(), pathList, resolve);
            }
            const nextFile = folder.getContent()[next];
            return _getFileWithRelPath(nextFile, pathList, resolve)
        };

        const _getFileFromLink = (link, pathList, resolve) => {
            let newPath = link.getContent();
            if (pathList?.length) newPath += '/' + pathList.join('/')
            return this.getFileFromPath(newPath, resolve);
        };

        const _import = (folder, arrJSON) => {
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
                    case FLDR: {
                        file = new JFolder(name);
                        _import(file, content);
                        break;
                    }
                    case DATA: {
                        file = new JFile(name, content);
                        break;
                    }
                    case LINK: {
                        file = new JLink(name, content);
                        break;
                    }
                    default:
                }
                _addSubFile(folder, file);
            });
        };

        const _addSubFile = (folder, file) => {
            if (!folder || !file || !(file.getName())) {
                console.error('folder or file invalid');
                return;
            }
            if (typeof(folder.getContent()) !== 'object') {
                console.error('folder contents invalid. making it a blank object.');
                folder.setContent({});
            }
            folder.getContent()[file.getName()] = file;
            file.setParent(folder);
        };


        ////// Public Fields //////////////////

        this.getRootDir = () => _root;

        this.getFileFromPath = (path, resolve=false) => {
            if (path[0] !== '/') path = `/${path}`;
            let pathList = path.split('/');
            pathList.shift();
            return _getFileWithRelPath(_root, pathList, resolve);
        };

        this.isValidPath = (path) => {
            return getFileFromPath(path) === undefined ? false : true;
        };

        this.getPath = (file) => {
            if (!file) return '<<err>>';
            if (file === _root) return '/';
            const parentName = this.getPath(file.getParent());
            return parentName + (parentName === '/' ? '' : '/') + file.getName();
        };


        ////// Initialize /////////////////////

        _import(_root, FS_IMPORT);
    }
}

const FS_IMPORT = [
    {
        "type": "<<folder>>",
        "name": "bin",
        "content": [
            {
                "type": "<<data>>",
                "name": "about",
                "content": `SHELL.print('Hey, I\\'m Jasper. todo');`
            },
            {
                "type": "<<data>>",
                "name": "cat",
                "content": `const file = SHELL.resolveFile(ARGS[1]);
if (!file) return;

if (file.getType() === '<<folder>>') {
    SHELL.error(ARGS[1] + ': is a directory');
    return;
}
SHELL.print(file.getContent());`
            },
            {
                "type": "<<data>>",
                "name": "contact",
                "content": `SHELL.print('✉ <a href="mailto:jasper.q.andrew@gmail.com">jasper.q.andrew@gmail.com</a>');`
            },
            {
                "type": "<<link>>",
                "name": "cv",
                "content": "/bin/resume"
            },
            {
                "type": "<<data>>",
                "name": "help",
                "content": `SHELL.error(ARGS[0] + ': program not implemented');`
            },
            {
                "type": "<<data>>",
                "name": "resume",
                "content": `SHELL.print('opening in new window...');
window.setTimeout(() => { window.open('http://www.jasperandrew.me/resume.pdf'); }, 500);`
            },
            {
                "type": "<<data>>",
                "name": "welcome",
                "content": `SHELL.print(
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
                "type": "<<data>>",
                "name": "errtest",
                "content": `SHELL.nofunction();`
            },
        ]
    },
    {
        "type": "<<folder>>",
        "name": "home",
        "content": [
            {
                "type": "<<folder>>",
                "name": "jasper",
                "content": [
                    {
                        "type": "<<data>>",
                        "name": "test",
                        "content": "blah"
                    },
                    {
                        "type": "<<link>>",
                        "name": "lonk",
                        "content": "/home/jasper/fodor/lunk"
                    },
                    {
                        "type": "<<folder>>",
                        "name": "fodor",
                        "content": [
                            {
                                "type": "<<data>>",
                                "name": "toast",
                                "content": "toasty"
                            },
                            {
                                "type": "<<link>>",
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