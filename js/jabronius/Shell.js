import { JFileType } from "./FileStructure.js";
import { ModCtrl } from "./Keyboard.js";
export var ExitCode;
(function (ExitCode) {
    ExitCode[ExitCode["SUCCESS"] = 0] = "SUCCESS";
    ExitCode[ExitCode["ERROR"] = 1] = "ERROR";
    ExitCode[ExitCode["USAGE"] = 2] = "USAGE";
})(ExitCode || (ExitCode = {}));
export class Shell {
    fs;
    dirPath;
    isPrinting = false;
    printQueue = [];
    printDelay = 7;
    buffer = '';
    prompt = new Prompt();
    bufferUpdatedListeners = new Set();
    fireBufferUpdated = () => this.bufferUpdatedListeners.forEach((l) => l(this.renderBuffer()));
    scriptSubmittedListeners = new Set();
    fireScriptSubmitted = (script, args) => this.scriptSubmittedListeners.forEach((l) => l(script, args, null, this.println, this.error));
    builtins = {
        cd: (args) => {
            let path = args[1] ?? '.', dir = this.resolveFile(path);
            if (dir?.type !== JFileType.Directory)
                return ExitCode.USAGE;
            this.dirPath = this.fs.getFilePath(dir);
            return ExitCode.SUCCESS;
        },
        rsmem: (args) => {
            localStorage.clear();
            window.location.reload();
            return ExitCode.SUCCESS;
        }
    };
    renderBuffer() {
        return (this.buffer + this.prompt.get()).split('\n');
    }
    constructor(fs, dirPath = '/') {
        this.fs = fs;
        this.dirPath = dirPath;
    }
    resolveFile = (path) => this.fs.getFile(this.absolutePath(path));
    printFromQueue() {
        this.isPrinting = true;
        let next = this.printQueue.pop();
        if (next === undefined) {
            this.isPrinting = false;
            return;
        }
        this.buffer += next.input + (next.newline ? '\n' : '');
        this.fireBufferUpdated();
        if (next.newline) {
            let id = setTimeout(() => {
                this.printFromQueue();
                clearTimeout(id);
            }, this.printDelay);
        }
        else {
            this.printFromQueue();
        }
    }
    processPrintInput(input = '', newline) {
        let split = input.split('\n');
        while (split.length > 0) {
            let s = split.shift() ?? '';
            this.printQueue.unshift({
                input: s,
                newline: split.length === 0 ? newline : true
            });
        }
        if (this.isPrinting)
            return;
        this.printFromQueue();
    }
    print = (s) => {
        this.processPrintInput(s);
    };
    println = (s) => {
        this.processPrintInput(s, true);
    };
    error = (msg) => {
        this.println('[!] ' + msg);
    };
    clearBuffer() {
        this.buffer = '';
        this.fireBufferUpdated();
    }
    absolutePath(path) {
        if (path?.startsWith('/'))
            return path;
        return this.dirPath + (path ? `/${path}` : '');
    }
    submitScript(args, dir = '/scr') {
        const name = args[0];
        const cmdPath = dir + `/${name}`;
        let file = this.fs.getFile(cmdPath);
        if (!file) {
            this.error(`${name}: command not found`);
            return;
        }
        if (file.type === JFileType.Directory) {
            this.error(`${name}: is a directory`);
            return;
        }
        let script = this.fs.readFile(file);
        if (!script)
            return;
        this.fireScriptSubmitted(script, args);
    }
    onKeySignal = (sig) => {
        if (sig.type === 'up')
            return;
        this.prompt.handleKeySignal(sig);
        if (!this.isPrinting) {
            this.fireBufferUpdated();
        }
        if (sig.code === 'Enter') {
            let cmd = this.prompt.get();
            this.prompt.pushHistory();
            this.println(cmd);
            this.run(cmd);
        }
    };
    run(argstr) {
        const ret = () => this.print(this.prompt.prefix); // this only works as long as scripts run synchronously
        if (!/\S/.test(argstr))
            return ret();
        const args = parseArgs(argstr);
        if (args.length === 0) {
            this.println('parse error');
            return ret();
        }
        const name = args[0];
        if (!/^[a-zA-Z_$][\w$]*$/.test(name)) {
            this.error(`${name}: invalid identifier`);
            return ret();
        }
        if (Object.keys(this.builtins).includes(name)) {
            this.builtins[name](args);
        }
        else {
            this.submitScript(args);
        }
        this.fireBufferUpdated();
        return ret();
    }
}
const parseArgs = (str) => {
    const delims = ['"', '\'', "\`"];
    let args = [], start = 0, i = 0;
    while (i < str.length) {
        let arg = '';
        if (i >= str.length - 1) { // e "u c" f
            arg = str.slice(start);
        }
        else if (str[i] === ' ') {
            arg = str.slice(start, i);
            start = i + 1;
        }
        else if (delims.indexOf(str[i]) > -1) {
            let d = str[i++];
            start = i;
            while (str[i] !== d) {
                i++;
                if (i >= str.length) {
                    console.error(`parse: missing delimiter (${d})`); // TODO: handle this better
                    return [];
                }
            }
            arg = str.slice(start, i);
            start = i + 1;
        }
        if (arg !== '' && arg !== ' ')
            args.push(arg.trim());
        i++;
    }
    return args;
};
class Prompt {
    prefix = '$ ';
    idx = 0;
    history = [''];
    navHistory = (up) => {
        this.idx = clamp(this.idx + (up ? 1 : -1), 0, this.history.length - 1);
    };
    navPrev = () => this.navHistory(true);
    navNext = () => this.navHistory(false);
    resetNav = () => this.idx = 0;
    get = () => this.history[this.idx];
    getLine = () => this.prefix + this.get();
    set = (s) => {
        this.history[0] = s;
        this.resetNav();
    };
    append = (s) => this.set(this.get() + s);
    pushHistory = () => {
        this.history[0] = this.get().trim();
        this.history.unshift('');
        this.history = [...new Set(this.history)];
        this.resetNav();
    };
    handleKeySignal = (sig) => {
        if (sig.char) {
            this.append(sig.char);
            return;
        }
        switch (sig.code) {
            case 'ArrowUp':
                this.navPrev();
                break;
            case 'ArrowDown':
                this.navNext();
                break;
            case 'Backspace':
                let s = this.get();
                if (sig.mod(ModCtrl)) {
                    const match = s.match(/\S*\s*$/);
                    if (match !== null)
                        this.set(s.slice(0, s.lastIndexOf(match.toString())));
                }
                else {
                    this.set(s.slice(0, -1));
                }
        }
    };
}
