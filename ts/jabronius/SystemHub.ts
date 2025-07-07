import { BrowserModel } from "../model/BrowserModel.js";
import { ViewModel } from "../model/ViewModel.js";
import { JFileSystem } from "./filesystem/JFileSystem.js";
import { Keyboard } from "./Keyboard.js";
import { Memory } from "./Memory.js";
import { Monitor } from "./Monitor.js";
import { Processor } from "./Processor.js";
import { Shell } from "./Shell.js";

export interface StartupConfig {
	on: boolean;
	commands: string[];
}

export class SystemHub {
	private readonly defConfig: StartupConfig = {
		on: true,
		commands: ['welcome']
	};

	private readonly memory: Memory = new Memory();
	private readonly monitor: Monitor = new Monitor();
	private readonly keyboard: Keyboard = new Keyboard();
	private readonly filesys: JFileSystem = new JFileSystem(this.memory);
	private readonly shell: Shell = new Shell(this, this.filesys, '/home/jasper');
	private readonly cpu: Processor = new Processor(this, this.shell, this.filesys);

	// the order the models are initialized is important
	private readonly viewModel: ViewModel = new ViewModel(this.monitor, this.keyboard);
	private readonly browserModel: BrowserModel = new BrowserModel(this, this.memory);

	constructor() {
		this.keyboard.keySignalListeners.add(this.shell.onKeySignal);
	}

	execScript(script: string, args: string[]) {
		this.cpu.execute(script, args, null,
			(tag: string, str: string) => this.shell.print(str),
			(tag: string, str: string) => this.shell.error(str)
		);
	}

	startupSystem(config: StartupConfig | null) {
		if (!config) config = this.defConfig;
		if (config.on) this.monitor.togglePower();

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