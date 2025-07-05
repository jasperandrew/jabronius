import { JFSData } from "../firmware/filesystem/JFSData.js";
import { JFSDirectory } from "../firmware/filesystem/JFSDirectory.js";
import { JFSType } from "../firmware/filesystem/JFSFile.js";
import { JFSLink } from "../firmware/filesystem/JFSLink.js";
export class Drive {
    data = DRIVE_DATA.split('\n').map((s) => decodeURIComponent(s));
    constructor() {
        console.log(this.data);
    }
    isValidAddress = (addr) => addr >= 1 && addr < this.data.length;
    isFileAddress = (addr) => this.isValidAddress(addr) && this.data[addr] && this.data[addr] !== '';
    isDirAddress = (addr) => this.isFileAddress(addr) && this.data[addr][0] === '1';
    formatDirData = (files) => files.map(f => `${f.name}/${f.address}`).join('|');
    formatFileData(file, content) {
        if (file instanceof JFSDirectory)
            content = this.formatDirData(file.files);
        return `${file.type}${file.name}|${content ?? ''}`;
    }
    writeFileStructure(root) {
        this.data[0] = JSON.stringify(root.files, (k, v) => k === 'parent' ? undefined : v);
        this.data[1] = this.formatDirData(root.files);
    }
    readFileStructure() {
        return this.data[0];
    }
    createFile(name, type, parent, content) {
        const address = this.data.length;
        this.data.push(type.valueOf().toString() + (content ?? ''));
        switch (type) {
            case JFSType.Data: return new JFSData(name, address, parent);
            case JFSType.Directory: return new JFSDirectory(name, address, parent);
            case JFSType.Link: return new JFSLink(name, address, parent);
        }
    }
    writeFile(file, content, append) {
        const addr = file.address;
        if (!this.isFileAddress(addr)) {
            console.log('not a valid file address: ' + addr);
            return false;
        }
        if (this.isDirAddress(addr)) {
            console.log('cannot write to directory address: ' + addr);
            return false;
        }
        content = content ?? '';
        if (append) {
            this.data[addr] += content;
            return true;
        }
        this.data[addr] = this.formatFileData(file, content);
        return true;
    }
    writeDirectory(dir) {
        const addr = dir.address;
        if (!this.isDirAddress(addr)) {
            console.log('not a valid directory address: ' + addr);
            return false;
        }
        this.data[addr] = JFSType.Directory.toString()
            + JSON.stringify(dir.files.map((f) => `${f.name}|${f.address}`));
        return true;
    }
    readFile(addr) {
        if (!this.isFileAddress(addr)) {
            console.log('not a valid file address: ' + addr);
            return null;
        }
        return this.data[addr];
    }
    shredFile(addr) {
        if (!this.isFileAddress(addr)) {
            console.log('not a valid file address: ' + addr);
            return false;
        }
        this.data[addr] = '';
        return true;
    }
}
