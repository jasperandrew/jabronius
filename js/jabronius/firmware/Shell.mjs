import { ModCtrl } from "../hardware/Keyboard.mjs";

export class Shell {
    constructor(_sys) {
        ////// Private Fields /////////////////
        let _printing = false, _print_queue = [], _print_delay = true,
            _buffer = '', _prompt = '',

            _history = (() => {
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
            })(),
    
            _outputFrame = (onlyPrompt=false) => {
                const frameBuffer = (!onlyPrompt ? _buffer : '') + '> ' + _prompt;
                _sys.pushFrame(frameBuffer, !onlyPrompt);
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
                        if(util.typeof(p) === 'Array') queue = p;
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

                if (newline && out === '') out = ' '; // fix for visual glitch with <br>
                window.setTimeout(() => {
                    doPrint();
                }, _print_delay ? 17 : 0);
                _buffer += out + (newline ? '\n' : '');
                _outputFrame();
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
                _outputFrame(true);
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
            _outputFrame(true);
        };

        this.submit = (cmd) => {
            if (!cmd) {
                cmd = _prompt;
                _prompt = '';
            }

            this.print('> ' + cmd);

            if (/\S/.test(cmd)) {
                _history.add(cmd);
                _sys.run(cmd);
            }
        };

        this.clearBuffer = () => {
            _buffer = '';
            _outputFrame();
        }
        
        ////// Initialize /////////////////
    }
}