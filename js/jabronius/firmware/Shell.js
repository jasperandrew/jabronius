import { ModCtrl } from "../hardware/Keyboard.js";
import { JDirectoryRoot } from "./struct/JDirectoryRoot.js";
import { JFileType } from "./struct/JFile.js";
export class Shell {
    _sys;
    _filesys;
    _dirPath;
    _printing = false;
    _print_queue = [];
    _print_delay = true;
    _buffer = '';
    _prompt = '';
    _prompt_char = '$';
    _history = (() => {
        let _lvl = 0, _list = [], _curr = '', nav = (key) => {
            if (_lvl === 0)
                _curr = this._prompt;
            if (key === 'ArrowUp') {
                _lvl += (_lvl > _list.length - 1 ? 0 : 1);
            }
            else if (key === 'ArrowDown') {
                _lvl += (_lvl < 0 ? 0 : -1);
            }
            if (_lvl > 0)
                this._prompt = _list[_lvl - 1];
            else
                this._prompt = _curr;
        }, add = (cmd) => {
            _lvl = 0;
            if (_list[0] !== cmd)
                _list.unshift(cmd);
        }, setLvl = (n) => { _lvl = n; };
        return { nav: nav, add: add, setLvl: setLvl };
    })();
    constructor(_sys, _filesys, _dirPath = '/') {
        this._sys = _sys;
        this._filesys = _filesys;
        this._dirPath = _dirPath;
    }
    _getAbsolutePath(path) {
        if (path?.startsWith('/'))
            return path;
        return this._dirPath + (path ? `/${path}` : '');
    }
    _resolveFile(path) {
        return this._filesys.getFileFromPath(this._getAbsolutePath(path), {});
    }
    _verifyFile(file, path) {
        if (!file) {
            this.error(`${path}: file not found`);
            return null;
        }
        return file;
    }
    _verifyDir(file, path) {
        if (!this._verifyFile(file, path))
            return null;
        if (file?.getType() !== JFileType.Directory) {
            this.error(`${file?.getName()}: not a directory`);
            return null;
        }
        return file;
    }
    _fireFrameUpdated(promptOnly) {
        this._sys.updateFrame(promptOnly);
    }
    _commands = {
        cd: (args) => {
            let path = args[1] ?? '.', dir = this.resolveDir(path);
            if (!dir)
                return false;
            this._dirPath = this._filesys.getPath(dir);
            return true;
        },
        ls: (args) => {
            let path = args[1] ?? '.', dir = this.resolveDir(path);
            if (!dir)
                return false;
            const list = dir.getContent();
            const names = Object.keys(list).map(name => list[name].toString());
            names.push('.');
            if (!(dir instanceof JDirectoryRoot))
                names.push('..');
            this.print(names.toSorted((a, b) => a.localeCompare(b)).join('\n'));
        },
        clear: () => this.clearBuffer(),
        echo: (args) => {
            args.shift();
            this.print(args.join(' '));
        },
        pwd: () => this.print(this._dirPath),
        touch: (args) => {
            let path = args[1];
            if (!path) {
                this.error(`touch: path argument required`);
                return false;
            }
            if (this._resolveFile(path)) {
                this.error(`${path}: already exists`);
                return false;
            }
            return this._filesys.createFile(this._getAbsolutePath(path));
        }
    };
    _submitPrompt() {
        const argstr = this._prompt.trim();
        this._prompt = '';
        this.print(this._prompt_char + ' ' + argstr);
        this._history.add(argstr);
        this.run(argstr);
    }
    _printFromQueue() {
        this._printing = true;
        if (this._print_queue.length === 0) {
            this._printing = false;
            return;
        }
        let next;
        [next, ...this._print_queue] = this._print_queue;
        if (!next)
            next = '';
        if (typename(next) !== 'String')
            next = next.toString();
        let split = next.split(/[\n\r]/);
        if (next !== split[0]) {
            [next, ...split] = split;
            for (let i = split.length - 1; i >= 0; i--)
                this._print_queue.unshift(split[i]);
        }
        this._buffer += next + '\n';
        this._fireFrameUpdated(false);
        window.setTimeout(() => this._printFromQueue(), this._print_delay ? 7 : 0);
    }
    _runScript(args, dir = '/scr') {
        const name = args[0];
        const cmdPath = dir + `/${name}`;
        let file = this._filesys.getFileFromPath(cmdPath, {});
        if (!file) {
            this.error(`${name}: command not found`);
            return;
        }
        if (file.getType() === JFileType.Directory) {
            this.error(`${name}: is a directory`);
            return;
        }
        this._sys.execScript(file.getContent(), args);
    }
    error(msg) {
        this.print('[!] ' + msg);
    }
    print(input = '') {
        this._print_queue.push(input);
        if (this._printing)
            return;
        this._printFromQueue();
    }
    onKeySignal(signal) {
        if (signal.char) {
            this._prompt += signal.char;
            this._history.setLvl(0);
            this._fireFrameUpdated(true);
            return;
        }
        switch (signal.code) {
            case 'Enter':
                this._submitPrompt();
                return;
            case 'ArrowUp':
            case 'ArrowDown':
                this._history.nav(signal.code);
                break;
            case 'Backspace':
                if (signal.mod(ModCtrl)) {
                    let val = this._prompt;
                    const match = val.match(/\S*\s*$/);
                    if (match !== null)
                        this._prompt = val.slice(0, val.lastIndexOf(match.toString()));
                }
                else {
                    this._prompt = this._prompt.slice(0, -1);
                }
            default:
        }
        this._fireFrameUpdated(true);
    }
    run(argstr) {
        if (!/\S/.test(argstr))
            return;
        const args = parseArgs(argstr);
        const name = args[0];
        if (!/^[a-zA-Z_$][\w$]*$/.test(name)) {
            console.log(name);
            this.error(`${name}: invalid identifier`);
            return;
        }
        if (Object.keys(this._commands).includes(name)) {
            this._commands[name](args);
        }
        else {
            this._runScript(args);
        }
    }
    getFrameBuffer() {
        let buf = [...this._buffer.split('\n')];
        buf[buf.length - 1] += this._prompt_char + ' ' + this._prompt;
        return buf;
    }
    clearBuffer() {
        this._buffer = '';
        this._fireFrameUpdated(false);
    }
    resolveFile(path) { return this._verifyFile(this._resolveFile(path), path); }
    resolveDir(path) { return this._verifyDir(this._resolveFile(path), path); }
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
                    console.error(`parse: missing delimiter (${d})`); // todo: handle this better
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
