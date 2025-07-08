import { FileStructure } from "./FileStructure.js";
import { Shell } from "./Shell.js";

export class Processor {
	constructor(
		private readonly shell: Shell,
		private readonly filesys: FileStructure
	) {}

	execute = (script: string, args: string[], input: string | null, outFn: Function, errFn: Function) => {
		const IN = { tag: args[0], data: input };

		try {
			const f = new Function('SHELL','FS','ARGS','IN','OUT','ERR', script);
			return f(this.shell, this.filesys, args, IN, outFn, errFn);
		} catch (e) {
			errFn(buildErrorMessage(e));
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