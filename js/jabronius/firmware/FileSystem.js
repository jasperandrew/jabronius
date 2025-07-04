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
        let JFS_JSON = localStorage.getItem('jfs_json');
        if (JFS_JSON) {
            try {
                this.importDir(this.root, JSON.parse(JFS_JSON));
            }
            catch (err) {
                console.log('local JFS import failed', err);
                JFS_JSON = null;
            }
        }
        if (!JFS_JSON) {
            this.importDir(this.root, JFS_ROOT);
            this.jfsUpdated();
        }
    }
    jfsUpdated() {
        localStorage.setItem('jfs_json', JSON.stringify(this.root.getContent(), (k, v) => k === 'parent' ? undefined : v));
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
                this.jfsUpdated();
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
            this.jfsUpdated();
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
        let nextFile = dir?.getContent().filter((f) => f.getName() === next)[0];
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
    importDir(dir, dirObj) {
        dirObj.forEach(f => {
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
    addSubFile(dir, file) {
        if (!dir) {
            console.error('invalid dir');
            return;
        }
        if (typeof (dir.getContent()) !== 'object') {
            console.error('dir contents invalid. making it a blank array.');
            dir.setContent([]);
        }
        dir.addFile(file);
    }
    getRoot() { return this.root; }
    getFile(filePath, config) {
        if (!config)
            config = {};
        return this.resolveAbsolutePath(this.getPathList(filePath), config);
    }
    getFilePath(file) {
        if (file === this.root)
            return '/';
        const parent = file.getParent();
        if (parent === null)
            return file.getName();
        const parentName = this.getFilePath(parent);
        return parentName + (parentName === '/' ? '' : '/') + file.getName();
    }
    createFile(filePath, fileType = JFileType.Data, mkdirs = true) {
        return this.resolveAbsolutePath(this.getPathList(filePath), {
            mkdirs: mkdirs,
            touch: true,
            type: fileType,
        });
    }
}
