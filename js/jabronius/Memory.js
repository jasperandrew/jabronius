import { JData, JDirectory, JLink, JFileType } from "./FileStructure.js";
export class Memory {
    memory = [];
    memoryReadyListeners = new Set();
    fireMemoryReady = () => this.memoryReadyListeners.forEach((l) => l());
    memoryUpdatedListeners = new Set();
    fireMemoryUpdated = () => this.memoryUpdatedListeners.forEach((l) => l(this.packMemory()));
    initMemory = (memoryStr) => {
        this.unpackMemory(memoryStr);
        this.fireMemoryReady();
    };
    unpackMemory(memoryStr) {
        this.memory = memoryStr.split('\n').map((s) => decodeB64(s));
    }
    packMemory() {
        return this.memory
            .map((s) => encodeB64(s))
            .join('\n');
    }
    isValidAddress = (addr) => addr > 1 && addr < this.memory.length;
    isFileAddress = (addr) => this.isValidAddress(addr) && this.memory[addr] && this.memory[addr] !== '';
    isDirAddress = (addr) => this.isFileAddress(addr) && this.memory[addr][0] === '1';
    formatDirData = (files) => files.map(f => `${f.name}/${f.address}`).join('|');
    formatFileData(file, content) {
        if (file instanceof JDirectory)
            content = this.formatDirData(file.files);
        return `${file.type}${file.name}|${content ?? ''}`;
    }
    writeFileStructure(root) {
        this.memory[0] = JSON.stringify(root.files, (k, v) => k === 'parent' ? undefined : v);
        this.memory[1] = this.formatDirData(root.files);
        this.fireMemoryUpdated();
    }
    readFileStructure() {
        return this.memory[0];
    }
    createFile(name, type, parent, content) {
        const address = this.memory.length;
        let file;
        switch (type) {
            case JFileType.Data:
                file = new JData(name, address, parent);
                break;
            case JFileType.Directory:
                file = new JDirectory(name, address, parent);
                break;
            case JFileType.Link:
                file = new JLink(name, address, parent);
                break;
        }
        this.memory.push(this.formatFileData(file, content));
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
            this.memory[addr] += content;
            this.fireMemoryUpdated();
            return true;
        }
        this.memory[addr] = this.formatFileData(file, content);
        this.fireMemoryUpdated();
        return true;
    }
    writeDirectory(dir) {
        const addr = dir.address;
        if (!this.isDirAddress(addr)) {
            console.error('not a valid directory address: ' + addr);
            return false;
        }
        this.memory[addr] = JFileType.Directory.toString()
            + JSON.stringify(dir.files.map((f) => `${f.name}|${f.address}`));
        this.fireMemoryUpdated();
        return true;
    }
    readFile(addr) {
        if (!this.isFileAddress(addr)) {
            console.error('not a valid file address: ' + addr);
            return null;
        }
        return this.memory[addr];
    }
    shredFile(addr) {
        if (!this.isFileAddress(addr)) {
            console.error('not a valid file address: ' + addr);
            return false;
        }
        this.memory[addr] = '';
        this.fireMemoryUpdated();
        return true;
    }
}
