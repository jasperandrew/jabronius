export class Processor {
	constructor(_sys, _shell, _filesys) {

		////// Public Fields //////////////////

		this.execute = (script, args, input, outFn, errFn) => {
			const IN = { tag: args[0], data: input };
			const OUT = (str) => outFn(args[0], str);
			const ERR = (str) => errFn(args[0], str);

			try {
				const f = new Function(['SYS','SHELL','FS','ARGS','IN','OUT','ERR'], script);
				return f(_sys, _shell, _filesys, args, IN, OUT, ERR);
			} catch (e) {
				let msg = e.name;
				if (e.lineNumber) {
					msg += ` (${e.lineNumber}`;
					if (e.columnNumber) msg += `,${e.columnNumber}`;
					msg += ')';
				}
				msg += `: ${e.message}`;
				ERR(msg);
				console.error(e);
				return false;
			}
		};
	}
}