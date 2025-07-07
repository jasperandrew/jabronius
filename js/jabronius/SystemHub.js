import { BrowserModel } from "../model/BrowserModel.js";
import { ViewModel } from "../model/ViewModel.js";
import { JFileSystem } from "./filesystem/JFileSystem.js";
import { Keyboard } from "./Keyboard.js";
import { Memory } from "./Memory.js";
import { Monitor } from "./Monitor.js";
import { Processor } from "./Processor.js";
import { Shell } from "./Shell.js";
export class SystemHub {
    defConfig = {
        on: true,
        commands: ['welcome']
    };
    memory = new Memory();
    monitor = new Monitor();
    keyboard = new Keyboard();
    filesys = new JFileSystem(this.memory);
    shell = new Shell(this, this.filesys, '/home/jasper');
    cpu = new Processor(this, this.shell, this.filesys);
    // the order the models are initialized is important
    viewModel = new ViewModel(this.monitor, this.keyboard);
    browserModel = new BrowserModel(this, this.memory);
    constructor() {
        this.keyboard.keySignalListeners.add(this.shell.onKeySignal);
    }
    execScript(script, args) {
        this.cpu.execute(script, args, null, (tag, str) => this.shell.print(str), (tag, str) => this.shell.error(str));
    }
    startupSystem(config) {
        if (!config)
            config = this.defConfig;
        if (config.on)
            this.monitor.togglePower();
        this.shell.clearBuffer();
        if (mobileCheck()) {
            this.shell.run('echo Currently, JaBRONIUS is only compatible with desktop browsers.');
            this.shell.run('echo We are working to correct this, so please try again later!');
            return;
        }
        if (config.commands)
            config.commands.forEach(c => this.shell.run(c));
    }
    updateFrame(promptOnly) {
        let buf = this.shell.getFrameBuffer();
        if (promptOnly) {
            buf = buf.slice((promptOnly ? 1 : 0) * -1);
        }
        this.monitor.displayFrame(buf, !promptOnly);
    }
}
