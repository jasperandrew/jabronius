import { KeyInputSignal } from './hardware/Keyboard.js';
export class ViewModel {
    shell;
    config = {
        on: true,
        commands: ['welcome']
    };
    displayElem = document.querySelector('#display');
    lightElem = document.querySelector('#light');
    lineElems = [];
    keyElems = {};
    constructor(shell, monitor, keyboard) {
        this.shell = shell;
        this.importSettingsFromURL();
        monitor.bindToViewModel(this.onMonitorPowerUpdated, this.onMonitorLinesUpdated, (f) => (document.querySelector('.button.power')).onclick = f);
        keyboard.bindToViewModel(this.onKeyboardLitKeysUpdated, (f) => this.keydown = f, (f) => document.onkeyup = f, (f) => document.onblur = f);
        document.onkeydown = this.onKeyDown;
    }
    getKeyElem(code) {
        if (this.keyElems[code] === undefined) {
            let elem = document.querySelector('.key.' + code);
            if (!elem)
                elem = null;
            this.keyElems[code] = elem;
            return elem;
        }
        return this.keyElems[code];
    }
    ;
    initDisplayRows(num_lines) {
        this.lineElems.length = 0;
        const readout = document.querySelector('#readout');
        readout.innerHTML = '';
        for (let i = 0; i < num_lines; i++) {
            const span = document.createElement('span');
            this.lineElems.push(span);
            readout.prepend(span);
        }
    }
    ;
    keydown = null;
    onKeyDown = (e) => {
        this.keydown?.call(null, e);
        this.shell.onKeySignal(KeyInputSignal.fromKeyboardEvent(e));
    };
    importSettingsFromURL = () => {
        const url = window.location.href;
        const start = url.indexOf('?') + 1;
        if (start === 0)
            return;
        const end = (url.indexOf('#') + 1 || url.length + 1) - 1;
        const paramStr = url.slice(start, end);
        if (paramStr.length < 1)
            return;
        const pairs = paramStr.replace(/\+/g, ' ').split('&');
        const truthy = ['1', 'true', 'yes', 'yep', 'on'];
        const falsey = ['0', 'false', 'no', 'nope', 'off'];
        pairs.forEach(pair => {
            let p = pair.split('=', 2);
            let name = decodeURIComponent(p[0]).trim(); // setting name
            let val = decodeURIComponent(p[1]); // setting value
            if (name === 'on') {
                let boolVal;
                if (truthy.indexOf(val) > -1) {
                    boolVal = true;
                }
                else if (falsey.indexOf(val) > -1) {
                    boolVal = false;
                }
                else {
                    console.warn(`Value '${val}' is invalid for setting '${name}'. Skipping...`);
                    return;
                }
                this.config.on = boolVal;
            }
            if (name === 'cmd') {
                this.config.commands.push(val);
            }
        });
    };
    onMonitorPowerUpdated = (on) => {
        if (on !== this.displayElem.classList.contains('on')) {
            this.lightElem.classList.toggle('on');
            this.displayElem.classList.toggle('on');
        }
    };
    onMonitorLinesUpdated = (lines) => {
        if (this.lineElems.length !== lines.length)
            this.initDisplayRows(lines.length);
        for (let i = 0; i < lines.length; i++) {
            if (i >= this.lineElems.length)
                break;
            if (this.lineElems[i].innerHTML !== lines[i])
                this.lineElems[i].innerHTML = lines[i];
        }
    };
    onKeyboardLitKeysUpdated = (litKeys) => {
        document.querySelectorAll('.key').forEach(elem => elem.classList.remove('on'));
        for (let key of litKeys) {
            this.getKeyElem(key)?.classList.add('on');
        }
    };
    getConfig() {
        return this.config;
    }
}
