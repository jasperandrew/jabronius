export class Monitor {
	constructor() {

		////// Private Fields /////////////////

		let _on = false;
		let _res_h = 71;
		let _res_v = 25;
		let _lines = new Array(_res_v);
		
		let _updater = null;
		const _notifyUpdater = () => {
			_updater?.call(null, _on, _lines);
		}


		////// Public Fields //////////////////

		this.bindUpdater = (func) => {
			_updater = func;
		}

		this.togglePower = () => {
			_on = !_on;
			_notifyUpdater();
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
			_notifyUpdater();
		};
	}
}