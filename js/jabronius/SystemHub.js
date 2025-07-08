import { BrowserModel } from "../model/BrowserModel.js";
import { ViewModel } from "../model/ViewModel.js";
import { FileStructure } from "./FileStructure.js";
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
    filesys = new FileStructure(this.memory);
    shell = new Shell(this.filesys, '/home/jasper');
    cpu = new Processor(this.shell, this.filesys);
    constructor() {
        this.keyboard.keySignalListeners.add(this.shell.onKeySignal);
        this.shell.bufferUpdatedListeners.add(this.monitor.displayFrame);
        this.shell.scriptSubmittedListeners.add(this.cpu.execute);
        // the order the models are initialized is important
        new ViewModel(this.monitor, this.keyboard);
        new BrowserModel(this, this.memory);
    }
    startupSystem = (config) => {
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
    };
}
