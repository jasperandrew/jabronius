import { ModCtrl } from "../hardware/Keyboard.mjs";
import { FLDR } from "./struct/JFile.mjs";

export class Shell {
    constructor(_sys, _filesys, _dirPath='/') {

        ////// Private Fields /////////////////

        let _printing = false;
        let _print_queue = [];
        let _print_delay = true;
        let _buffer = '';
        let _prompt = '';
        let _prompt_char = '$';

        const _history = (() => {
            let _lvl = 0, _list = [], _curr = '',
            
            nav = (key) => {
                if (_lvl === 0) _curr = _prompt;

                if (key === 'ArrowUp') {
                    _lvl += (_lvl > _list.length-1 ? 0 : 1);
                } else if (key === 'ArrowDown') {
                    _lvl += (_lvl < 0 ? 0 : -1);
                }
            
                if (_lvl > 0) _prompt = _list[_lvl-1];
                else _prompt = _curr;    
            },
            
            add = (cmd) => {
                _lvl = 0;
                if (_list[0] !== cmd) _list.unshift(cmd);
            },
            
            setLvl = (n) => { _lvl = n; };

            return { nav: nav, add: add, setLvl: setLvl };
        })();

        const _resolveFile = (path) => {
            let absPath;
            if (path?.startsWith('/')) {
                absPath = path;
            } else {
                absPath = _dirPath + (path ? `/${path}` : '');
            }
            return _filesys.getFileFromPath(absPath, true);
        };

        const _verifyFile = (file, path) => {
            if (!file) {
                this.error(`${path}: file not found`);
                return null;
            }
            
            return file;
        };

        const _verifyDir = (file, path) => {
            if (!_verifyFile(file, path)) return null;

            if (file.getType() !== FLDR) {
                this.error(`${file.getName()}: not a directory`);
                return null;
            }

            return file;
        };

        const _fireFrameUpdated = (promptOnly) => {
            _sys.updateFrame(promptOnly ? 1 : 0);
        };

        const _commands = {
            cd: (args) => {
                let path = args[1],
                    file = this.resolveDir(path);

                if (!file) return false;
    
                _dirPath = _filesys.getPath(file);
                return true;
            },
            ls: (args) => {
                let path = args[1] ?? '.',
                    folder = this.resolveDir(path);

                if (!folder) return false;

                const list = folder.getContent(),
                    names = Object.keys(list).map(name => list[name].toString());
                names.push('.');
                if (!folder.isRoot()) names.push('..');

                this.print(names.toSorted((a,b) => a.localeCompare(b)).join('\n'));
            },
            clear: () => this.clearBuffer(),
            echo: (args) => {
                args.shift();
                this.print(args.join(' '));
            },
            pwd: () => this.print(_dirPath),
        };

        const _submitPrompt = () => {
            const argstr = _prompt.trim();
            _prompt = '';
            this.print(_prompt_char + ' ' + argstr);
            this.run(argstr);
        };

        const _printFromQueue = () => {
            _printing = true;
            if (_print_queue.length === 0) {
                _printing = false;
                return;
            }

            let next; [next, ..._print_queue] = _print_queue;
            if (!next) next = '';
            if (typename(next) !== 'String') next = next.toString();
            
            let split = next.split(/[\n\r]/);
            if (next !== split[0]) {
                [next, ...split] = split;
                for (let i = split.length-1; i >= 0; i--)
                    _print_queue.unshift(split[i]);
            }

            _buffer += next + '\n';
            _fireFrameUpdated();

            window.setTimeout(() => _printFromQueue(), _print_delay ? 7 : 0);
        };

        const _runScript = (argstr, dir='/scr') => {
            if (typename(argstr) !== 'String') {
                console.error('Arguments must be a string');
                return;
            }

            if (!/\S/.test(argstr)) return;

            const args = parseArgs(argstr),
                name = args[0],
                cmdPath = dir + `/${name}`;

            let file = _filesys.getFileFromPath(cmdPath, true);

            if (!file) {
                this.error(`${name}: command not found`);
                return;
            }
            
            if (file.getType() === FLDR) {
                this.error(`${name}: is a directory`);
                return;
            }

            _sys.execScript(file.getContent(), args);
        };


        ////// Public Fields //////////////////
        this.error = (msg) => {
            this.print('[!] ' + msg);
        };

        this.print = (input='') => {
            _print_queue.push(input);
            if (_printing) return;

            _printFromQueue();
        };

        this.onKeySignal = (signal) => {
            if (signal.char) {
                _prompt += signal.char;
                _history.setLvl(0);
                _fireFrameUpdated(true);
                return;
            }
    
            switch (signal.code) {
                case 'Enter': _submitPrompt(); return;
                case 'ArrowUp':
                case 'ArrowDown': _history.nav(signal.code); break;
                case 'Backspace':
                    if (signal.mod(ModCtrl)) {
                        let val = _prompt;
                        const match = val.match(/\S*\s*$/);
                        _prompt = val.slice(0, val.lastIndexOf(match));
                    } else {
                        _prompt = _prompt.slice(0, -1);
                    }
                default:
            }
            _fireFrameUpdated(true);
        };

        this.run = (argstr) => {
            if (!/\S/.test(argstr)) return;

            _history.add(argstr);

            const args = parseArgs(argstr),
                name = args[0];

            if (Object.keys(_commands).includes(name)) {
                _commands[name](args);
            } else {
                _runScript(argstr);
            }
        };

        this.getFrameBuffer = () => {
            let buf = [..._buffer.split('\n')];
            buf[buf.length-1] += _prompt_char + ' ' + _prompt;
            return buf;
        };

        this.clearBuffer = () => {
            _buffer = '';
            _fireFrameUpdated();
        };

        this.resolveFile = (path) => _verifyFile(_resolveFile(path), path);
        this.resolveDir = (path) => _verifyDir(_resolveFile(path), path);
    }
}

export const parseArgs = (str) => {
    let delims = ['"', '\''],
        args = [],
        start = 0, i = 0;

    while (i < str.length) {
        let arg = '';

        if (i >= str.length-1) { // e "u c" f
            arg = str.slice(start);
        } else if (str[i] === ' ') {
            arg = str.slice(start, i);
            start = i+1;
        } else if (delims.indexOf(str[i]) > -1) {
            let d = str[i++];
            start = i;
            while(str[i] !== d){
                i++;
                if(i >= str.length){
                    console.error(`parse: missing delimiter (${d})`);
                    return null;
                }
            }
            arg = str.slice(start, i);
            start = i+1;
        }

        if (arg !== '' && arg !== ' ') args.push(arg);
        i++;
    }
    
    return args;
}