import { JFolderRoot } from '../data/JFolderRoot.mjs';

export class FileSystem {
    constructor() {
        ////// Private Fields /////////////////
        let _root,
        
            _getFileFromRelPath = (file, pathList, resolve=false) => {
                if (!pathList?.length) {
                    if (resolve && file?.getType() === 'link')
                        return this.getFileFromPath(file.getContent(), true);
                    return file;
                }
                switch (file?.getType()) {
                    case 'fldr':
                    case 'fldr_root': {
                        const nextFile = file.getContent()[pathList.shift()];
                        return _getFileFromRelPath(nextFile, pathList, resolve)
                    }
                    case 'link': {
                        let newPath = file.getContent();
                        if (pathList?.length) newPath += '/' + pathList.join('/')
                        return this.getFileFromPath(newPath, resolve);
                    }
                    case 'data':
                    default:
                        return null;
                }
            };

        ////// Public Fields //////////////////
        this.getRootDir = () => _root;

        this.getFileFromPath = (path, resolve=false) => {
            if (path[0] !== '/') path = `/${path}`;
            let pathList = path.split('/');
            pathList.shift();
            return _getFileFromRelPath(_root, pathList, resolve);
        };

        this.isValidPath = (path) => {
            return getFileFromPath(path) === undefined ? false : true;
        };

        ////// Initialize /////////////////////
        _root = new JFolderRoot();
        _root.import(FS_IMPORT);
    }
}