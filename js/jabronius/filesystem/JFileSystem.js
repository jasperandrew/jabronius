import { JFSData } from "./JFSData.js";
import { JFSDirectory } from "./JFSDirectory.js";
import { JFSType } from "./JFSFile.js";
import { JFSLink } from "./JFSLink.js";
import { JFSRoot } from "./JFSRoot.js";
const DEFAULT_PATH_RESOLVE = true;
const DEFAULT_PATH_MKDIRS = false;
const DEFAULT_PATH_TOUCH = false;
export class JFileSystem {
    memory;
    root = new JFSRoot();
    constructor(memory) {
        this.memory = memory;
        memory.driveReadyListeners.add(() => this.readFromDisk());
        // this.root = this.readFromDisk();
        // console.log(this.root);
    }
    writeToDisk = () => {
        this.memory.writeFileStructure(this.root);
    };
    readFromDisk() {
        try {
            this.root = this.parseJFSDir(JSON.parse(this.memory.readFileStructure()));
        }
        catch (err) {
            console.error('JFS parse failed', err);
        }
    }
    parseJFSDir(dirFiles, dir) {
        if (!dir)
            dir = new JFSRoot();
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
            if (resolve && file?.type === JFSType.Link)
                return this.resolvePathFromLink(file, [], config);
            if (touch && parent && name) {
                file = this.memory.createFile(name, type, parent);
                parent.addFile(file);
                this.writeToDisk();
            }
            return file;
        }
        switch (file?.type) {
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
            let newDir = this.memory.createFile(name, JFSType.Directory, parent);
            parent.addFile(newDir);
            this.writeToDisk();
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
            return this.resolvePathFromFolder(dir ? dir.parent : null, pathList, config);
        }
        let nextFile = dir?.files.filter((f) => f.name === next)[0];
        config.parent = dir;
        config.name = next;
        return this.resolveRelativePath(nextFile, pathList, config);
    }
    resolvePathFromLink(link, pathList, config) {
        let newPath = this.readFile(link);
        if (!newPath)
            return null;
        if (pathList.length)
            newPath += '/' + pathList.join('/');
        return this.resolveAbsolutePath(this.getPathList(newPath), config);
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
        const parent = file.parent;
        if (parent === null)
            return file.name;
        const parentName = this.getFilePath(parent);
        return parentName + (parentName === '/' ? '' : '/') + file.name;
    }
    createFile(filePath, fileType = JFSType.Data, mkdirs = true) {
        const file = this.resolveAbsolutePath(this.getPathList(filePath), {
            mkdirs: mkdirs,
            touch: true,
            type: fileType,
        });
        this.writeToDisk();
        return file;
    }
    removeFile(file) {
        file?.parent?.removeFile(file.name);
        this.writeToDisk();
    }
    readFile(file) {
        if (!file?.address)
            return null;
        const data = this.memory.readFile(file?.address);
        if (!data)
            return null;
        return data?.substring(data.indexOf('|') + 1);
    }
}
