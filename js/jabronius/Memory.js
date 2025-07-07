import { JFSData } from "./filesystem/JFSData.js";
import { JFSDirectory } from "./filesystem/JFSDirectory.js";
import { JFSType } from "./filesystem/JFSFile.js";
import { JFSLink } from "./filesystem/JFSLink.js";
export class Memory {
    data = [];
    driveReadyListeners = new Set();
    fireDriveReady = () => this.driveReadyListeners.forEach((l) => l());
    memoryUpdatedListeners = new Set();
    fireMemoryUpdated = () => this.memoryUpdatedListeners.forEach((l) => l(this.packDrive()));
    initMemory = (memData) => {
        this.unpackDrive(memData);
        this.fireDriveReady();
    };
    unpackDrive(driveData) {
        this.data = driveData.split('\n').map((s) => decodeURIComponent(s));
    }
    packDrive() {
        return this.data
            .map((s) => encodeURIComponent(s))
            .join('\n');
    }
    isValidAddress = (addr) => addr > 1 && addr < this.data.length;
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
        this.fireMemoryUpdated();
    }
    readFileStructure() {
        return this.data[0];
    }
    createFile(name, type, parent, content) {
        const address = this.data.length;
        let file;
        switch (type) {
            case JFSType.Data:
                file = new JFSData(name, address, parent);
                break;
            case JFSType.Directory:
                file = new JFSDirectory(name, address, parent);
                break;
            case JFSType.Link:
                file = new JFSLink(name, address, parent);
                break;
        }
        this.data.push(this.formatFileData(file, content));
        this.fireMemoryUpdated();
        return file;
    }
    writeFile(file, content, append) {
        const addr = file.address;
        if (!this.isFileAddress(addr)) {
            console.error('not a valid file address: ' + addr);
            return false;
        }
        if (this.isDirAddress(addr)) {
            console.error('cannot write to directory address: ' + addr);
            return false;
        }
        content = content ?? '';
        if (append) {
            this.data[addr] += content;
            this.fireMemoryUpdated();
            return true;
        }
        this.data[addr] = this.formatFileData(file, content);
        this.fireMemoryUpdated();
        return true;
    }
    writeDirectory(dir) {
        const addr = dir.address;
        if (!this.isDirAddress(addr)) {
            console.error('not a valid directory address: ' + addr);
            return false;
        }
        this.data[addr] = JFSType.Directory.toString()
            + JSON.stringify(dir.files.map((f) => `${f.name}|${f.address}`));
        this.fireMemoryUpdated();
        return true;
    }
    readFile(addr) {
        if (!this.isFileAddress(addr)) {
            console.error('not a valid file address: ' + addr);
            return null;
        }
        return this.data[addr];
    }
    shredFile(addr) {
        if (!this.isFileAddress(addr)) {
            console.error('not a valid file address: ' + addr);
            return false;
        }
        this.data[addr] = '';
        this.fireMemoryUpdated();
        return true;
    }
}
