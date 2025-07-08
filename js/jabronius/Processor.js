export class Processor {
    shell;
    filesys;
    constructor(shell, filesys) {
        this.shell = shell;
        this.filesys = filesys;
    }
    execute = (script, args, input, outFn, errFn) => {
        const IN = { tag: args[0], data: input };
        try {
            const f = new Function('SHELL', 'FS', 'ARGS', 'IN', 'OUT', 'ERR', script);
            return f(this.shell, this.filesys, args, IN, outFn, errFn);
        }
        catch (e) {
            errFn(buildErrorMessage(e));
            console.error(e);
            return false;
        }
    };
}
function buildErrorMessage(err) {
    let msg = err?.name;
    if (err?.lineNumber) {
        msg += ` (${err?.lineNumber}`;
        if (err?.columnNumber)
            msg += `,${err?.columnNumber}`;
        msg += ')';
    }
    msg += `: ${err?.message}`;
    return msg;
}
