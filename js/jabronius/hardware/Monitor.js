export class Monitor {
    constructor() {
        this.on = false;
        this.res_h = 71;
        this.res_v = 25;
        this.lines = new Array(this.res_v);
        this.powerUpdater = null;
        this.notifyPowerUpdated = () => {
            var _a;
            (_a = this.powerUpdater) === null || _a === void 0 ? void 0 : _a.call(null, this.on);
        };
        this.linesUpdater = null;
        this.notifyLinesUpdated = () => {
            var _a;
            (_a = this.linesUpdater) === null || _a === void 0 ? void 0 : _a.call(null, this.lines);
        };
    }
    bindToViewModel(powerUpdater, linesUpdater, bindPowerClick) {
        this.powerUpdater = powerUpdater;
        this.linesUpdater = linesUpdater;
        bindPowerClick(this.togglePower);
    }
    togglePower() {
        this.on = !this.on;
        this.notifyPowerUpdated();
    }
    ;
    displayFrame(textLines, clear = true, reversed = true) {
        if (reversed)
            textLines.reverse();
        for (let i = 0; i < this.lines.length; i++) {
            let line = textLines[i];
            if (line !== '' && !line) {
                if (clear)
                    line = '';
                else
                    continue;
            }
            const len = renderedTextLength(line);
            if (len < this.res_h)
                line += ' '.repeat(this.res_h - len);
            this.lines[i] = line;
        }
        this.notifyLinesUpdated();
    }
    ;
}
