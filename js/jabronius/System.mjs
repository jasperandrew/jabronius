import { Shell } from './firmware/Shell.mjs';
import { Keyboard } from './hardware/Keyboard.mjs';
import { Monitor } from './hardware/Monitor.mjs';
import { FileSystem } from './firmware/FileSystem.mjs';
import { Processor } from './hardware/Processor.mjs';
import { ViewModel } from './ViewModel.mjs';

export class System {
	constructor() {

		////// Private Fields /////////////////

		const _monitor = new Monitor();
		const _keyboard = new Keyboard();
		const _filesys = new FileSystem();
		const _shell = new Shell(this, _filesys, '/home/jasper');
		const _cpu = new Processor(this, _shell, _filesys);
		// const _drive;
		const _viewModel = new ViewModel(_monitor, _keyboard, _shell);

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

		let settings = _viewModel.getSettings();
		if (settings.on) _monitor.togglePower();

		this.startup(settings);
	}
}