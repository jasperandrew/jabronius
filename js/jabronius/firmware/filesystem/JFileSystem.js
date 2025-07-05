import { JFSDirectory } from "./JFSDirectory.js";
import { JFSRoot } from "./JFSRoot.js";
import { JFSFile, JFSType } from "./JFSFile.js";
import { JFSLink } from "./JFSLink.js";
const DEFAULT_PATH_RESOLVE = true;
const DEFAULT_PATH_MKDIRS = false;
const DEFAULT_PATH_TOUCH = false;
let jfsUpdateCallback = null;
export function jfsUpdated() {
    jfsUpdateCallback?.call(null);
}
export class JFileSystem {
    root = new JFSRoot();
    constructor() {
        jfsUpdateCallback = this.jfsUpdated;
        let JFS_JSON = localStorage.getItem('jfs_json');
        if (JFS_JSON) {
            try {
                this.importDir(this.root, JSON.parse(JFS_JSON));
                // recover if scr directory is deleted, until a reset is added
                if (!this.resolveAbsolutePath(this.getPathList('/scr'), {})) {
                    console.log('no scripts, resetting');
                    JFS_JSON = null;
                }
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
    jfsUpdated = () => {
        localStorage.setItem('jfs_json', JSON.stringify(this.root.getContent(), (k, v) => k === 'parent' ? undefined : v));
    };
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
        let resolve = config.resolve ?? DEFAULT_PATH_RESOLVE, mkdirs = config.mkdirs ?? DEFAULT_PATH_MKDIRS, touch = config.touch ?? DEFAULT_PATH_TOUCH, type = config.type ?? JFSType.Data, parent = config.parent, name = config.name;
        if (!pathList.length) {
            if (resolve && file?.getType() === JFSType.Link)
                return this.resolvePathFromLink(file, [], config);
            if (touch && parent && name) {
                switch (type) {
                    case JFSType.Data:
                        file = new JFSFile(name, null, parent);
                        break;
                    case JFSType.Directory:
                        file = new JFSDirectory(name, parent);
                        break;
                    case JFSType.Link:
                        file = new JFSLink(name, '.', parent);
                        break;
                }
                parent.addFile(file);
            }
            return file;
        }
        switch (file?.getType()) {
            case JFSType.Directory: {
                return this.resolvePathFromFolder(file, pathList, config);
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
            let newDir = new JFSDirectory(name, parent);
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
                case JFSType.Data: {
                    file = new JFSFile(name, content, dir);
                    break;
                }
                case JFSType.Directory: {
                    file = new JFSDirectory(name, dir);
                    this.importDir(file, content);
                    break;
                }
                case JFSType.Link: {
                    file = new JFSLink(name, content, dir);
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
    createFile(filePath, fileType = JFSType.Data, mkdirs = true) {
        return this.resolveAbsolutePath(this.getPathList(filePath), {
            mkdirs: mkdirs,
            touch: true,
            type: fileType,
        });
    }
    removeFile(file) {
        file?.getParent()?.removeFile(file.getName());
    }
}
