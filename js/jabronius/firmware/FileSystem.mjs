import { DATA, FLDR, JFile, LINK } from './struct/JFile.mjs';
import { JFolder } from './struct/JFolder.mjs';
import { JFolderRoot } from './struct/JFolderRoot.mjs';
import { JLink } from './struct/JLink.mjs';

export class FileSystem {
    constructor() {
        ////// Private Fields /////////////////
        let _root,
        
            _getFileWithRelPath = (file, pathList, resolve) => {
                console.log(file?.getName(), pathList);
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
            },
            _getFileFromFolder = (folder, pathList, resolve) => {
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
            },
            _getFileFromLink = (link, pathList, resolve) => {
                let newPath = link.getContent();
                if (pathList?.length) newPath += '/' + pathList.join('/')
                return this.getFileFromPath(newPath, resolve);
            },

            _import = (folder, arrJSON) => {
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
            },
            _addSubFile = (folder, file) => {
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
        _root = new JFolderRoot();
        _import(_root, FS_IMPORT);
    }
}