export class Monitor {
	private on = false;
	private res_h = 71;
	private res_v = 25;
	private lines = new Array(this.res_v);
	
	private powerUpdater: Function | null = null;
	private notifyPowerUpdated = () => {
		this.powerUpdater?.call(null, this.on);
	}

	private linesUpdater: Function | null = null;
	private notifyLinesUpdated = () => {
		this.linesUpdater?.call(null, this.lines);
	}

	bindModel(powerUpdater: Function, linesUpdater: Function, bindPowerClick: Function) {
		this.powerUpdater = powerUpdater;
		this.linesUpdater = linesUpdater;
		bindPowerClick(this.togglePower);
	}

	togglePower = () => {
		this.on = !this.on;
		this.notifyPowerUpdated();
	}

	displayFrame(textLines: string[], clear=true, reversed=true) {
		if (reversed) textLines.reverse();
		for (let i = 0; i < this.lines.length; i++) {
			let line = textLines[i];
			if (line !== '' && !line) {
				if (clear) line = '';
				else continue;
			}
			const len = renderedTextLength(line);
			if (len < this.res_h) line += ' '.repeat(this.res_h - len);
			this.lines[i] = line;
		}
		this.notifyLinesUpdated();
	}
}