import { KeyInputSignal } from "../jabronius/hardware/Keyboard.js";
export class ViewModel {
    shell;
    displayElem = document.querySelector('#display');
    lightElem = document.querySelector('#light');
    lineElems = [];
    keyElems = {};
    constructor(shell, monitor, keyboard) {
        this.shell = shell;
        monitor.bindModel(this.onMonitorPowerUpdated, this.onMonitorLinesUpdated, (f) => (document.querySelector('.button.power')).onclick = f);
        keyboard.bindModel(this.onKeyboardLitKeysUpdated, (f) => this.keydown = f, (f) => document.onkeyup = f, (f) => document.onblur = f);
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
}
