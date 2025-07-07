import { KeyInputSignal } from "../jabronius/Keyboard.js";
export class ViewModel {
    monitor;
    keyboard;
    displayElem = document.querySelector('#display');
    lightElem = document.querySelector('#light');
    lineElems = [];
    keyElems = {};
    constructor(monitor, keyboard) {
        this.monitor = monitor;
        this.keyboard = keyboard;
        monitor.powerUpdateListeners.add(this.onMonitorPowerUpdated);
        monitor.linesUpdateListeners.add(this.onMonitorLinesUpdated);
        keyboard.litKeysUpdateListeners.add(this.onLitKeysUpdated);
        document.querySelector('.button.power')?.addEventListener('click', this.onPowerButtonClick);
        document.addEventListener('keydown', this.onKeyboardEvent);
        document.addEventListener('keyup', this.onKeyboardEvent);
        document.addEventListener('blur', this.onBlur);
    }
    onPowerButtonClick = (e) => {
        // TODO: timer for "hard reset"
        this.monitor.togglePower();
    };
    onKeyboardEvent = (e) => {
        this.keyboard.onKeySignal(KeyInputSignal.fromKeyboardEvent(e));
    };
    onBlur = () => {
        this.onLitKeysUpdated();
        this.keyboard.litKeys.clear();
    };
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
    onMonitorPowerUpdated = (isOn) => {
        if (isOn !== this.displayElem?.classList.contains('on')) {
            this.lightElem?.classList.toggle('on');
            this.displayElem?.classList.toggle('on');
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
    onLitKeysUpdated = (litKeys) => {
        document.querySelectorAll('.key').forEach(elem => elem.classList.remove('on'));
        if (!litKeys)
            return;
        for (let key of litKeys) {
            this.getKeyElem(key)?.classList.add('on');
        }
    };
}
