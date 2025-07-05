export class Monitor {
    on = false;
    res_h = 71;
    res_v = 25;
    lines = new Array(this.res_v);
    powerUpdater = null;
    notifyPowerUpdated = () => {
        this.powerUpdater?.call(null, this.on);
    };
    linesUpdater = null;
    notifyLinesUpdated = () => {
        this.linesUpdater?.call(null, this.lines);
    };
    bindModel(powerUpdater, linesUpdater, bindPowerClick) {
        this.powerUpdater = powerUpdater;
        this.linesUpdater = linesUpdater;
        bindPowerClick(this.togglePower);
    }
    togglePower = () => {
        this.on = !this.on;
        this.notifyPowerUpdated();
    };
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
}
