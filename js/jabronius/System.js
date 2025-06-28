import { FileSystem } from './firmware/FileSystem';
import { Shell } from './firmware/Shell';
import { Keyboard } from './hardware/Keyboard';
import { Monitor } from './hardware/Monitor';
import { Processor } from './hardware/Processor';
export class System {
    constructor() {
        this.monitor = new Monitor();
        this.keyboard = new Keyboard();
        this.filesys = new FileSystem();
        this.shell = new Shell(this, this.filesys, '/home/jasper');
        this.cpu = new Processor(this, this.shell, this.filesys);
        this.viewModel = new (this.monitor, this.keyboard, this.shell);
        let config = this.viewModel.getConfig();
        if (config.on)
            this.monitor.togglePower();
        this.startup(config);
    }
    out(tag, str) {
        this.shell.print(str);
    }
    err(tag, str) {
        this.shell.error(str);
    }
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
