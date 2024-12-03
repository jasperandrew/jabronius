import { Shell } from './firmware/Shell.mjs';
import { Keyboard } from './hardware/Keyboard.mjs';
import { Display } from './hardware/Display.mjs';
import { FileSystem } from './firmware/FileSystem.mjs';
import { FLDR } from './firmware/struct/JFile.mjs';

export class System {
    constructor() {

        ////// Private Fields /////////////////

        let _settings = {
            on: true,
            welcome: true,
            cmd: []
        };

        const _display = new Display();
        const _keyboard = new Keyboard(this);
        // const _cpu, _drive;
        const _filesys = new FileSystem();
        const _shell = new Shell(this, _filesys, '/home/jasper');

        const _importSettingsFromURL = () => {
            const url = window.location.href,
                start = url.indexOf('?') + 1;

            if (start === 0) return false;

            const end = (url.indexOf('#') + 1 || url.length + 1) - 1,
                paramStr = url.slice(start, end);
            if (paramStr.length < 1) return false;
            
            const pairs = paramStr.replace(/\+/g, ' ').split('&'),
                truthy = ['1','true', 'yes','yep', 'on'],
                falsey = ['0','false','no', 'nope','off'];

            pairs.forEach(pair => {
                let p = pair.split('=', 2);
                let name = decodeURIComponent(p[0]).trim(), // setting name
                    val = decodeURIComponent(p[1]); // setting value
                let type = typename(_settings[name]);

                switch (type) {
                    case 'Boolean': {
                        if (truthy.indexOf(val) > -1) {
                            _settings[name] = true;
                            break;
                        }
                        if (falsey.indexOf(val) > -1) {
                            _settings[name] = false;
                            break;
                        }
                        console.warn(`Value '${val}' is invalid for setting '${name}'. Skipping...`);
                        break;
                    }
                    case 'String': {
                        _settings[name] = val;
                        break;
                    }
                    case 'Array': {
                        _settings[name].push(val);
                        break;
                    }
                    default:
                        console.warn(`Setting '${name}' does not exist. Skipping...`);
                }
            });

            return true;
        };

        const _out = (str) => {
            _shell.print(str);
        };

        const _err = (str) => {
            _shell.error(str);
        };


        ////// Public Fields //////////////////

        this.onKeySignal = (signal) => {
            _shell.onKeySignal(signal);
        };

        this.updateFrame = (lines) => {
            let buf = _shell.getFrameBuffer();
            if (lines) {
                buf = buf.slice(lines * -1);
            }
            _display.displayFrame(buf, !lines);
        };

        this.run = (argstr, dir=_filesys.getFileFromPath('/scr')) => {        
            if (typename(argstr) !== 'String') {
                console.error('Arguments must be a string');
                return false;
            }

            const args = parseArgs(argstr),
                name = args[0],
                cmdPath = _filesys.getPath(dir) + `/${name}`;

            let file = _filesys.getFileFromPath(cmdPath, true);

            if (!file) {
                _shell.error(`${name}: command not found`);
                return false;
            }
            
            if (file.getType() === FLDR) {
                _shell.error(`${name}: is a directory`);
                return false;
            }

            try {
                const f = new Function(['SYS','SHELL','FS','ARGS','IN','OUT','ERR'], file.getContent());
                return f(this, _shell, _filesys, args, null, _out, _err);
            } catch (e) {
                let msg = e.name;
                if (e.lineNumber) {
                    msg += ` (${e.lineNumber}`
                    if (e.columnNumber) msg += `,${e.columnNumber}`;
                    msg += ')';
                }
                msg += `: ${e.message}`;
                _shell.error(msg);
                console.error(e);
                return false;
            }
        };

        this.startup = (settings) => {
            _shell.clearBuffer();
            if (settings.welcome) this.run('welcome');
            if (settings.cmd) settings.cmd.forEach(c => this.run(c));	
        };


        ////// Initialize /////////////////////

        _importSettingsFromURL();
        if (_settings.on) _display.togglePower();

        this.startup(_settings);
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
                    _shell.error(`parse: missing delimiter (${d})`);
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