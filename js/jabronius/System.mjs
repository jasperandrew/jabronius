import { Shell } from './firmware/Shell.mjs';
import { Keyboard } from './hardware/Keyboard.mjs';
import { Display } from './hardware/Display.mjs';
import { JFileStructure } from './data/JFileStructure.mjs';
import { JPath } from './data/JPath.mjs';

export class System {
    constructor() {
        ////// Private Fields /////////////////
        let _settings,
            _display, _keyboard, _cpu, _drive,
            _shell;

        let _file_struct, _user, _pc;

        ////// Public Fields //////////////////
        this.importSettingsFromURL = () => {
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
                let type = util.typeof(_settings[name]);

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

        this.onKeySignal = (signal) => {
            _shell.onKeySignal(signal);
        };

        this.getFileStruct = () => _file_struct;
        this.getShell = () => _shell;
        this.getUser = () => _user;
        this.getPC = () => _pc;

        this.cd = (path) => {
            console.log(path);
            if (!path) path = '/home/jasper';
            let file = _file_struct.getFileFromPath(path, true);
            if (!file) {
                _shell.error(`${path}: does not exist`);
                return false;
            }
            
            if (file.getType().search('fldr') === -1) {
                _shell.error(`${path}: not a directory`);
                return false;
            }

            _file_struct.setCurDir(file);
            return true;
        };

        this.run = (argstr, dir=_file_struct.getFileFromPath('/bin')) => {
            function parseArgs(str) {
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
        
            if (util.typeof(argstr) !== 'String') {
                console.error('Arguments must be a string');
                return false;
            }

            const args = parseArgs(argstr),
                name = args[0];

            if (name === 'cd') {
                this.cd(args[1]);
                return true;
            }

            let file = dir?.getData()[name];
            switch (file?.getType()) {
                case 'link': {
                    file = _file_struct.getFileFromPath(file.getData(), true);
                }
                case 'data': {
                    if (!file) break;
                    const f = new Function(['sys','shell','fs','args'], file.getData());
                    return f(this, _shell, _file_struct, args);
                }
            }

            _shell.error(`${name}: command not found`);
            return false;
        };

        this.startup = (settings) => {
            this.run('clear');
            if (settings.welcome) this.run('welcome');
            if (settings.cmd) settings.cmd.forEach(c => this.run(c));	
        };

        this.write = (data='', path, append=false) => {
            const fp = new JPath(path);
            let file;
            if (!_file_struct.isValidPath(fp.toString())) {
                fp.up();
                if (!_file_struct.isValidPath(fp.toString())) {
                    _shell.error(`${fp.toString()} does not exist`);
                    return false;
                }
                file = new JFile(fp.getLeaf(), 'data', null);
                _file_struct.getFileFromPath(fp.toString()).addFile(file);
            } else {
                file = fp.getFile();
            }

            if (file.type !== 'data') {
                _shell.error(`${file.getPath()} is not writable`);
                return false;
            }
            
            file.setData(append ? file.getData() + data : data);
            return true;
        };

        this.pushFrame = (frameBuffer, clear=true) => {
            const frameRows = frameBuffer.split('\n');
            _display.displayFrame(frameRows, clear);
        };

        ////// Initialize /////////////////////
        _settings = {
            on: true,
            welcome: true,
            cmd: []
        };

        _display = new Display();
        _keyboard = new Keyboard(this);
        // _cpu = new Processor();
        // _drive = new Drive();
        _shell = new Shell(this);

        this.importSettingsFromURL();
        if (_settings['on']) _display.togglePower();

        _file_struct = new JFileStructure();
        _user = 'jasper';
        _pc = 'PC';

        this.startup(_settings);
    }
}