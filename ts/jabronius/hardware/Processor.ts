import { JFileSystem } from "../firmware/filesystem/JFileSystem.js";
import { Shell } from "../firmware/Shell.js";
import { System } from "../System.js";

export class Processor {
	constructor(
		private readonly sys: System,
		private readonly shell: Shell,
		private readonly filesys: JFileSystem
	) {}

	execute(script: string, args: string[], input: string | null, outFn: Function, errFn: Function) {
		const IN = { tag: args[0], data: input };
		const OUT = (str: string) => outFn(args[0], str);
		const ERR = (str: string) => errFn(args[0], str);

		try {
			const f = new Function('SYS','SHELL','FS','ARGS','IN','OUT','ERR', script);
			return f(this.sys, this.shell, this.filesys, args, IN, OUT, ERR);
		} catch (e) {
			ERR(buildErrorMessage(e));
			console.error(e);
			return false;
		}
	};
}

function buildErrorMessage(err: any) {
	let msg = err?.name;
	if (err?.lineNumber) {
		msg += ` (${err?.lineNumber}`;
		if (err?.columnNumber) msg += `,${err?.columnNumber}`;
		msg += ')';
	}
	msg += `: ${err?.message}`;
	return msg;
}