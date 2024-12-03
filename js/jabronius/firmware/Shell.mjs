import { ModCtrl } from "../hardware/Keyboard.mjs";
import { parseArgs } from "../System.mjs";
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
            _sys.onFrameUpdated(promptOnly ? 1 : 0);
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

                this.print(names.toSorted((a,b) => a.localeCompare(b)));
            },
            clear: () => this.clearBuffer(),
            echo: (args) => {
                args.shift();
                this.print(args.join(' '));
            },
            pwd: () => this.print(_dirPath),
            rm: (args) => this.error(args[0] + ': program not implemented'),
        };

        ////// Public Fields //////////////////
        this.error = (msg) => {
            this.print('[!] ' + msg);
        };

        this.print = (input='', newline=true) => {
            function doPrint() {
                if (queue.length === 0) {
                    if (_print_queue.length > 0) {
                        let p;
                        [p, ..._print_queue] = _print_queue;
                        if(typename(p) === 'Array') queue = p;
                        else queue = [p];
                    } else {
                        _printing = false;
                        return true;
                    }
                }

                let out, split;
                [out, ...queue] = queue;

                if (out === null) {
                    doPrint();
                    return true;
                }
                
                out = out.toString();
                if (out === undefined) out = '<<ERR>>';

                split = out.split(/[\n\r]/);
                if (out !== split[0]) {
                    [out, ...split] = split;
                    for(let i = split.length-1; i >= 0; i--)
                        queue.unshift(split[i]);
                }

                window.setTimeout(() => {
                    doPrint();
                }, _print_delay ? 7 : 0);
                _buffer += out + (newline ? '\n' : '');
                _fireFrameUpdated();
            }

            _print_queue.push(input);
            if (_printing) return true;

            let queue = [];
            _printing = true;
            doPrint();
        };

        this.onKeySignal = (signal) => {
            if (signal.char) {
                _prompt += signal.char;
                _history.setLvl(0);
                _fireFrameUpdated(true);
                return;
            }
    
            switch (signal.code) {
                case 'Enter': this.submit(); return;
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

        this.submit = (argStr) => {
            if (!argStr) {
                argStr = _prompt.trim();
                _prompt = '';
            }

            this.print(_prompt_char + ' ' + argStr);

            if (/\S/.test(argStr)) {
                _history.add(argStr);

                const args = parseArgs(argStr),
                    name = args[0];

                if (Object.keys(_commands).includes(name)) {
                    _commands[name](args);
                } else {
                    _sys.run(argStr);
                }
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