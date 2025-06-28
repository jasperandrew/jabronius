export class Monitor {
	constructor() {

		////// Private Fields /////////////////

		let _on = false;
		let _res_h = 71;
		let _res_v = 25;
		let _lines = new Array(_res_v);
		
		let _powerUpdater = null;
		const _notifyPowerUpdated = () => {
			_powerUpdater?.call(null, _on);
		}
		let _linesUpdater = null;
		const _notifyLinesUpdated = () => {
			_linesUpdater?.call(null, _lines);
		}


		////// Public Fields //////////////////

		this.bindToViewModel = (powerUpdater, linesUpdater, bindPowerClick) => {
			_powerUpdater = powerUpdater;
			_linesUpdater = linesUpdater;
			bindPowerClick(this.togglePower);
		}

		this.togglePower = () => {
			_on = !_on;
			_notifyPowerUpdated();
		};

		this.displayFrame = (textLines, clear=true, reversed=true) => {
			if (reversed) textLines.reverse();
			for (let i = 0; i < _lines.length; i++) {
				let line = textLines[i];
				if (line !== '' && !line) {
					if (clear) line = '';
					else continue;
				}
				const len = renderedTextLength(line);
				if (len < _res_h) line += ' '.repeat(_res_h - len);
				_lines[i] = line;
			}
			_notifyLinesUpdated();
		};
	}
}