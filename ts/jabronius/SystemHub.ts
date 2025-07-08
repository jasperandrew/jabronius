import { BrowserModel } from "../model/BrowserModel.js";
import { ViewModel } from "../model/ViewModel.js";
import { FileStructure } from "./FileStructure.js";
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
	private readonly filesys: FileStructure = new FileStructure(this.memory);
	private readonly shell: Shell = new Shell(this.filesys, '/home/jasper');
	private readonly cpu: Processor = new Processor(this.shell, this.filesys);

	constructor() {
		this.keyboard.keySignalListeners.add(this.shell.onKeySignal);
		this.shell.bufferUpdatedListeners.add(this.monitor.displayFrame);
		this.shell.scriptSubmittedListeners.add(this.cpu.execute);

		// the order the models are initialized is important
		new ViewModel(this.monitor, this.keyboard);
		new BrowserModel(this, this.memory);
	}

	startupSystem = (config: StartupConfig | null) => {
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
}