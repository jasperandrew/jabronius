import { JFileSystem } from "./firmware/filesystem/JFileSystem.js";
import { Shell } from "./firmware/Shell.js";
import { Keyboard } from "./hardware/Keyboard.js";
import { Monitor } from "./hardware/Monitor.js";
import { Processor } from "./hardware/Processor.js";
import { ViewModel } from "./ViewModel.js";
export class System {
    monitor = new Monitor();
    keyboard = new Keyboard();
    filesys = new JFileSystem();
    shell = new Shell(this, this.filesys, '/home/jasper');
    cpu = new Processor(this, this.shell, this.filesys);
    viewModel = new ViewModel(this.shell, this.monitor, this.keyboard);
    constructor() {
        let config = this.viewModel.getConfig();
        if (config.on)
            this.monitor.togglePower();
        this.startup(config);
    }
    out = (tag, str) => {
        this.shell.print(str);
    };
    err = (tag, str) => {
        this.shell.error(str);
    };
    execScript(script, args) {
        this.cpu.execute(script, args, null, this.out, this.err);
    }
    startup(config) {
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
