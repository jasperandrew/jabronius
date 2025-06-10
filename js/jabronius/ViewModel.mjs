import { KeyInputSignal } from "./hardware/Keyboard.mjs";

export class ViewModel {
	constructor(_monitor, _keyboard, _shell) {

		////// Private Fields /////////////////

		const _settings = {
				on: true,
				welcome: true,
				cmd: []
		};

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
			readout.innerHTML = '';
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

		const _importSettingsFromURL = () => {
			const url = window.location.href;
			const start = url.indexOf('?') + 1;

			if (start === 0) return false;

			const end = (url.indexOf('#') + 1 || url.length + 1) - 1;
			const paramStr = url.slice(start, end);
			if (paramStr.length < 1) return false;

			const pairs = paramStr.replace(/\+/g, ' ').split('&');
			const truthy = ['1','true', 'yes','yep', 'on'];
			const falsey = ['0','false','no', 'nope','off'];

			pairs.forEach(pair => {
				let p = pair.split('=', 2);
				let name = decodeURIComponent(p[0]).trim(), // setting name
					val = decodeURIComponent(p[1]); // setting value
				let type = typename(_settings[name]);

				switch (type) {
					case 'Boolean': {
						if (truthy.indexOf(val) > -1) {
							_settings[name] = true;
							break;
						}
						if (falsey.indexOf(val) > -1) {
							_settings[name] = false;
							break;
						}
						console.warn(`Value '${val}' is invalid for setting '${name}'. Skipping...`);
						break;
					}
					case 'String': {
						_settings[name] = val;
						break;
					}
					case 'Array': {
						_settings[name].push(val);
						break;
					}
					default:
						console.warn(`Setting '${name}' does not exist. Skipping...`);
				}
			});

			return true;
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

		this.getSettings = () => {
			return _settings;
		};


		////// Initialize /////////////////////

		_importSettingsFromURL();

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