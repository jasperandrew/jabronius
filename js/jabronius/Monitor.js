export class Monitor {
    isOn = false;
    resHorizontal = 71;
    resVertical = 25;
    lines = new Array(this.resVertical);
    powerUpdateListeners = new Set();
    firePowerUpdated = () => this.powerUpdateListeners.forEach((l) => l(this.isOn));
    linesUpdateListeners = new Set();
    fireLinesUpdated = () => this.linesUpdateListeners.forEach((l) => l(this.lines));
    togglePower = () => {
        this.isOn = !this.isOn;
        this.firePowerUpdated();
    };
    displayFrame = (textLines, clear = true) => {
        textLines = textLines.toReversed(); // screen lines have [0] on bottom
        for (let i = 0; i < this.lines.length; i++) {
            let line = textLines[i];
            if (line !== '' && !line) {
                if (clear)
                    line = '';
                else
                    continue;
            }
            const len = renderedTextLength(line);
            if (len < this.resHorizontal)
                line += ' '.repeat(this.resHorizontal - len);
            this.lines[i] = line;
        }
        this.fireLinesUpdated();
    };
}
