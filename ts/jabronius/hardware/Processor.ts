import { System } from "../System";
import { FileSystem } from './firmware/FileSystem';
import { Shell } from './firmware/Shell';

export class Processor {
	constructor(
		private readonly sys: System,
		private readonly shell: Shell,
		private readonly filesys: FileSystem
	) {}

	execute(script: string, args: Array<string>, input: string | null, outFn: Function, errFn: Function) {
		const IN = { tag: args[0], data: input };
		const OUT = (str: string) => outFn(args[0], str);
		const ERR = (str: string) => errFn(args[0], str);

		try {
			const f = new Function('SYS','SHELL','FS','ARGS','IN','OUT','ERR', script);
			return f(this.sys, this.shell, this.filesys, args, IN, OUT, ERR);
		} catch (e) {
			const err = e as any;
			let msg = err?.name;
			if (err?.lineNumber) {
				msg += ` (${err?.lineNumber}`;
				if (err?.columnNumber) msg += `,${err?.columnNumber}`;
				msg += ')';
			}
			msg += `: ${err?.message}`;
			ERR(msg);
			console.error(e);
			return false;
		}
	};
}