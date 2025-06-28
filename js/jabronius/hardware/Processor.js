export class Processor {
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
            let msg = err === null || err === void 0 ? void 0 : err.name;
            if (err === null || err === void 0 ? void 0 : err.lineNumber) {
                msg += ` (${err === null || err === void 0 ? void 0 : err.lineNumber}`;
                if (err === null || err === void 0 ? void 0 : err.columnNumber)
                    msg += `,${err === null || err === void 0 ? void 0 : err.columnNumber}`;
                msg += ')';
            }
            msg += `: ${err === null || err === void 0 ? void 0 : err.message}`;
            ERR(msg);
            console.error(e);
            return false;
        }
    }
    ;
}
