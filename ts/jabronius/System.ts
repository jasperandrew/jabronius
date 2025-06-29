import { FileSystem } from './firmware/FileSystem.js';
import { Shell } from './firmware/Shell.js';
import { Keyboard } from './hardware/Keyboard.js';
import { Monitor } from './hardware/Monitor.js';
import { Processor } from './hardware/Processor.js';
import { InitConfig, ViewModel } from './ViewModel.js';

export class System {
	private readonly monitor: Monitor = new Monitor();
	private readonly keyboard: Keyboard = new Keyboard();
	private readonly filesys: FileSystem = new FileSystem();
	private readonly shell: Shell = new Shell(this, this.filesys, '/home/jasper');
	private readonly cpu: Processor = new Processor(this, this.shell, this.filesys);
	private readonly viewModel: ViewModel = new ViewModel(this.shell, this.monitor, this.keyboard);

	constructor() {
		let config = this.viewModel.getConfig();
		if (config.on) this.monitor.togglePower();

		this.startup(config);
	}

	private out = (tag: string, str: string) => {
		this.shell.print(str);
	}

	private err = (tag: string, str: string) => {
		this.shell.error(str);
	}

	execScript(script: string, args: string[]) {
		this.cpu.execute(script, args, null, this.out, this.err);
	}

	startup(config: InitConfig) {
		this.shell.clearBuffer();
		if (mobileCheck()) {
			this.shell.run('echo Currently, JaBRONIUS is only compatible with desktop browsers.');
			this.shell.run('echo We are working to correct this, so please try again later!');
			return;
		}
		if (config.commands) config.commands.forEach(c => this.shell.run(c));
	}

	updateFrame(promptOnly: boolean) {
		let buf = this.shell.getFrameBuffer();
		if (promptOnly) {
			buf = buf.slice((promptOnly ? 1 : 0) * -1);
		}
		this.monitor.displayFrame(buf, !promptOnly);
	}
}