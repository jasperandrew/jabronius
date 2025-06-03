import { KeyInputSignal } from "./hardware/Keyboard.mjs";

export class ViewModel {
	constructor(_monitor, _keyboard, _shell) {

		////// Private Fields /////////////////

		const _displayElem = document.querySelector('#display');
		const _lightElem = document.querySelector('#light');
		const _lineElems = [];
		const _keyElems = {};

		const _getKeyElem = (code) => {
			if (_keyElems[code] === undefined) {
					let elem = document.querySelector('.key.' + code);
					if (!elem) elem = null;
					_keyElems[code] = elem;
					return elem;
			}
			return _keyElems[code];
		};

		const _initDisplayRows = (num_lines) => {
			_lineElems.length = 0;
			const readout = document.querySelector('#readout');
			for (let i = 0; i < num_lines; i++) {
				const span = document.createElement('span');
				_lineElems.push(span);
				readout.prepend(span);
			}
		};

		let _keydown = null;
		const _onKeyDown = (e) => {
			_keydown?.call(null, e);
			_shell.onKeySignal(KeyInputSignal.fromKeyboardEvent(e));
		};

		////// Public Fields //////////////////

		this.onMonitorPowerUpdated = (on) => {
			if (on !== _displayElem.classList.contains('on')) {
				_lightElem.classList.toggle('on');
				_displayElem.classList.toggle('on');
			}
		};

		this.onMonitorLinesUpdated = (lines) => {
			if (_lineElems.length !== lines.length)
				_initDisplayRows(lines.length);

			for (let i = 0; i < lines.length; i++) {
				if (i >= _lineElems.length) break;
				if (_lineElems[i].innerHTML !== lines[i])
					_lineElems[i].innerHTML = lines[i];
			}
		};

		this.onKeyboardLitKeysUpdated = (litKeys) => {
			document.querySelectorAll('.key').forEach(elem => elem.classList.remove('on'));
			for (let key of litKeys) {
				_getKeyElem(key)?.classList.add('on');
			}
		};

		////// Initialize /////////////////////

		_monitor.bindToViewModel(
			this.onMonitorPowerUpdated,
			this.onMonitorLinesUpdated,
			f => document.querySelector('.button.power').onclick = f);

		_keyboard.bindToViewModel(
			this.onKeyboardLitKeysUpdated,
			f => _keydown = f,
			f => document.onkeyup = f,
			f => document.onblur = f
		);

		document.onkeydown = _onKeyDown;
	}
}