import { FileStructure, JFileType } from "./FileStructure.js";
import { KeyInputSignal, ModCtrl } from "./Keyboard.js";

export enum ExitCode { SUCCESS, ERROR, USAGE }
type BuiltinCommand = (args: string[]) => ExitCode;

export type BufferUpdateListener = (buffer: string[]) => void;
export type ScriptSubmitListener = (script: string, args: string[], input: string | null, outFn: Function, errFn: Function) => void;

export class Shell {
	private isPrinting = false;
	private printQueue: string[] = [];
	private printDelay = 7;
	private buffer: string[] = [];
	private prompt = new Prompt();

	readonly bufferUpdatedListeners: Set<BufferUpdateListener> = new Set();
	private fireBufferUpdated = () => this.bufferUpdatedListeners.forEach((l: BufferUpdateListener) => l(this.buffer));

	readonly scriptSubmittedListeners: Set<ScriptSubmitListener> = new Set();
	private fireScriptSubmitted = (script: string, args: string[]) => 
		this.scriptSubmittedListeners.forEach((l: ScriptSubmitListener) => 
			l(script, args, null, this.print, this.error));

	private builtins: { [id: string] : BuiltinCommand } = {
		cd: (args: string[]) => {
			let path = args[1] ?? '.',
			dir = this.resolveFile(path);
			if (dir?.type !== JFileType.Directory) return ExitCode.USAGE;
			
			this.dirPath = this.fs.getFilePath(dir);
			return ExitCode.SUCCESS;
		},
		resetdrive: (args: string[]) => {
			localStorage.clear();
			window.location.reload();
			return ExitCode.SUCCESS;
		}
	}

	constructor(
		private readonly fs: FileStructure,
		private dirPath = '/'
	) {}

	resolveFile = (path: string) => this.fs.getFile(this.absolutePath(path));

	private printFromQueue() {
		this.isPrinting = true;
		let next = this.printQueue.pop();
		if (next === undefined) {
			this.isPrinting = false;
			// this.buffer.unshift(this.prompt.getLine());
			// this.fireBufferUpdated();
			return;
		}

		this.buffer.unshift(next);
		this.fireBufferUpdated();

		let id = setTimeout(() => {
			this.printFromQueue();
			clearTimeout(id);
		}, this.printDelay);
	}

	private processPrintInput(input: string | string[] = '') {
		if (typeof(input) === 'string') {
			let split = (input as string).split('\n');
			if (split.length > 1) input = split;
		}
		if (input instanceof Array) {
			input.forEach((s: string) => this.printQueue.unshift(s));
		} else {
			this.printQueue.unshift(input as string);
		}

		if (this.isPrinting) return;
		this.printFromQueue();
	}

	clearBuffer() {
		this.buffer.length = 0;
		this.fireBufferUpdated();
	}

	private absolutePath(path: string) {
		if (path?.startsWith('/')) return path;
		return this.dirPath + (path ? `/${path}` : '');
	}

	private submitScript(args: string[], dir = '/scr') {
		const name = args[0];
		const cmdPath = dir + `/${name}`;

		let file = this.fs.getFile(cmdPath);

		if (!file) {
			this.error(`${name}: command not found`);
			return;
		}

		if (file.type === JFileType.Directory) {
			this.error(`${name}: is a directory`);
			return;
		}

		let script = this.fs.readFile(file);
		if (!script) return;
		this.fireScriptSubmitted(script, args);
	}

	print = (s?: string | string[]) => {
		this.processPrintInput(s);
	}

	error = (msg: string) => {
		this.print('[!] ' + msg);
	}

	private runPrompt() {
		this.run(this.prompt.get());
		this.prompt.pushHistory();
	}

	onKeySignal = (sig: KeyInputSignal) => {
		if (sig.type === 'up') return;
		this.prompt.handleKeySignal(sig);
		if (!this.isPrinting) {
			this.buffer[0] = this.prompt.getLine();
			this.fireBufferUpdated();
		}

		if (sig.code === 'Enter') {
			this.runPrompt();
		}
	}

	run(argstr: string) {
		if (!/\S/.test(argstr)) return;
		
		const args = parseArgs(argstr);
		if (args.length === 0) {
			this.print('parse error');
			return;
		}

		const name = args[0];
		if (!/^[a-zA-Z_$][\w$]*$/.test(name)) {
			this.error(`${name}: invalid identifier`);
			return;
		}

		if (Object.keys(this.builtins).includes(name)) {
			this.builtins[name](args);
		} else {
			this.submitScript(args);
		}

		this.print(this.prompt.prefix); // this only works as long as all scripts run synchronously and without interruption
		this.fireBufferUpdated();
	}
}

const parseArgs = (str: string) => {
	const delims = ['"', '\'', "\`"];
	let args = [], start = 0, i = 0;

	while (i < str.length) {
		let arg = '';

		if (i >= str.length-1) { // e "u c" f
			arg = str.slice(start);
		} else if (str[i] === ' ') {
			arg = str.slice(start, i);
			start = i+1;
		} else if (delims.indexOf(str[i]) > -1) {
			let d = str[i++];
			start = i;
			while(str[i] !== d){
				i++;
				if(i >= str.length){
					console.error(`parse: missing delimiter (${d})`); // TODO: handle this better
					return [];
				}
			}
			arg = str.slice(start, i);
			start = i+1;
		}

		if (arg !== '' && arg !== ' ') args.push(arg.trim());
		i++;
	}

	return args;
}

class Prompt {
	prefix = '$ ';
	private idx = 0;
	private history: string[] = [''];

	private navHistory = (up: boolean) => {
		this.idx = clamp(this.idx + (up ? 1 : -1), 0, this.history.length-1);
	}

	navPrev = () => this.navHistory(true);
	navNext = () => this.navHistory(false);
	resetNav = () => this.idx = 0;

	get = () => this.history[this.idx];
	getLine = () => this.prefix + this.get();

	set = (s: string) => {
		this.history[0] = s;
		this.resetNav();
	}
	append = (s: string) => this.set(this.get() + s);

	pushHistory = () => {
		this.history[0] = this.get().trim();
		this.history.unshift('');
		this.history = [...new Set(this.history)];
		this.resetNav();
	}

	handleKeySignal = (sig: KeyInputSignal) => {
		if (sig.char) {
			this.append(sig.char);
			return;
		}

		switch (sig.code) {
			case 'ArrowUp': this.navPrev(); break;
			case 'ArrowDown': this.navNext(); break;
			case 'Backspace':
				let s = this.get();
				if (sig.mod(ModCtrl)) {
					const match = s.match(/\S*\s*$/);
					if (match !== null)
						this.set(s.slice(0, s.lastIndexOf(match.toString())));
				} else {
					this.set(s.slice(0, -1));
				}
		}
	}
}