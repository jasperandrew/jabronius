import {JFolderRoot} from './JFolderRoot.mjs';

export class JFileStructure {
    constructor() {
        ////// Private Fields /////////////////
        let _root, _cur;

        ////// Public Fields //////////////////
        this.getRootDir = () => _root;
        this.getCurDir = () => _cur;
        this.setCurDir = (f) => { _cur = f; };

        this.getFileFromPath = (path, resolve=false) => {
            if (path[0] !== '/') {
                path = _cur.getPath() + '/' + path;
            }
            path = path.split('/');
            let file = _root;
            path.forEach(p => {
                if (!file || file.getType() === 'data') return undefined;
                if (file.getType() === 'link') file = this.getFileFromPath(file.getData());
                if (p !== '') file = file.getData()[p];
            });

            if (resolve) {
                if(file && file.getType() === 'link') file = this.getFileFromPath(file.getData());
            }

            return file;
        };

        this.isValidPath = (path) => {
            return getFileFromPath(path) === undefined ? false : true;
        };

        ////// Initialize /////////////////////
        _root = new JFolderRoot();
        _root.import(JFS_IMPORT);
        this.setCurDir(this.getFileFromPath('/home/jasper'));
    }
}