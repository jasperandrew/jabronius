import { Shell } from './firmware/Shell.mjs';
import { Keyboard } from './hardware/Keyboard.mjs';
import { Monitor } from './hardware/Monitor.mjs';
import { FileSystem } from './firmware/FileSystem.mjs';
import { Processor } from './hardware/Processor.mjs';
import { ViewModel } from './ViewModel.mjs';

export class System {
	constructor() {

		////// Private Fields /////////////////

		let _settings = {
			on: true,
			welcome: true,
			cmd: []
		};

		const _monitor = new Monitor();
		const _keyboard = new Keyboard();
		const _filesys = new FileSystem();
		const _shell = new Shell(this, _filesys, '/home/jasper');
		const _cpu = new Processor(this, _shell, _filesys);
		// const _drive;
		const _viewModel = new ViewModel(_monitor, _keyboard, _shell);

		const _importSettingsFromURL = () => {
			const url = window.location.href,
				start = url.indexOf('?') + 1;

			if (start === 0) return false;

			const end = (url.indexOf('#') + 1 || url.length + 1) - 1,
				paramStr = url.slice(start, end);
			if (paramStr.length < 1) return false;

			const pairs = paramStr.replace(/\+/g, ' ').split('&'),
				truthy = ['1','true', 'yes','yep', 'on'],
				falsey = ['0','false','no', 'nope','off'];

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

		const _out = (tag, str) => {
			_shell.print(str);
		};

		const _err = (tag, str) => {
			_shell.error(str);
		};


		////// Public Fields //////////////////

		this.updateFrame = (lines) => {
			let buf = _shell.getFrameBuffer();
			if (lines) {
				buf = buf.slice(lines * -1);
			}
			_monitor.displayFrame(buf, !lines);
		};

		this.execScript = (script, args) => {
			_cpu.execute(script, args, null, _out, _err);
		};

		this.startup = (settings) => {
			_shell.clearBuffer();
			if (mobileCheck()) {
				_shell.run('echo Currently, JaBRONIUS is only compatible with desktop browsers.');
				_shell.run('echo We are working to correct this, so please try again later!');
				return;
			}
			if (settings.welcome) _shell.run('welcome');
			if (settings.cmd) settings.cmd.forEach(c => _shell.run(c));	
		};


		////// Initialize /////////////////////

		_importSettingsFromURL();
		if (_settings.on) _monitor.togglePower();

		this.startup(_settings);
	}
}