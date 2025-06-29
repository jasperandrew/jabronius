export class Processor {
    sys;
    shell;
    filesys;
    constructor(sys, shell, filesys) {
        this.sys = sys;
        this.shell = shell;
        this.filesys = filesys;
    }
    execute(script, args, input, outFn, errFn) {
        const IN = { tag: args[0], data: input };
        const OUT = (str) => outFn(args[0], str);
        const ERR = (str) => errFn(args[0], str);
        try {
            const f = new Function('SYS', 'SHELL', 'FS', 'ARGS', 'IN', 'OUT', 'ERR', script);
            return f(this.sys, this.shell, this.filesys, args, IN, OUT, ERR);
        }
        catch (e) {
            const err = e;
            let msg = err?.name;
            if (err?.lineNumber) {
                msg += ` (${err?.lineNumber}`;
                if (err?.columnNumber)
                    msg += `,${err?.columnNumber}`;
                msg += ')';
            }
            msg += `: ${err?.message}`;
            ERR(msg);
            console.error(e);
            return false;
        }
    }
    ;
}
