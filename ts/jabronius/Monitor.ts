export type PowerUpdateListener = (isOn: boolean) => void;
export type LinesUpdateListener = (lines: string[]) => void;

export class Monitor {
	private isOn = false;
	private resHorizontal = 71;
	private resVertical = 25;
	private lines: string[] = new Array(this.resVertical);
	
	readonly powerUpdateListeners: Set<PowerUpdateListener> = new Set();
	private firePowerUpdated = () => this.powerUpdateListeners.forEach((l: PowerUpdateListener) => l(this.isOn));

	readonly linesUpdateListeners: Set<LinesUpdateListener> = new Set();
	private fireLinesUpdated = () => this.linesUpdateListeners.forEach((l: LinesUpdateListener) => l(this.lines));

	togglePower = () => {
		this.isOn = !this.isOn;
		this.firePowerUpdated();
	}

	displayFrame = (textLines: string[], clear=true) => {
		textLines = textLines.toReversed(); // screen lines have [0] on bottom
		for (let i = 0; i < this.lines.length; i++) {
			let line = textLines[i];
			if (line !== '' && !line) {
				if (clear) line = '';
				else continue;
			}
			const len = renderedTextLength(line);
			if (len < this.resHorizontal) line += ' '.repeat(this.resHorizontal - len);
			this.lines[i] = line;
		}
		this.fireLinesUpdated();
	}
}