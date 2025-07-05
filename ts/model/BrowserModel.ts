import { JFSDirectory } from "../jabronius/firmware/filesystem/JFSDirectory.js";
import { JFSFile, JFSType } from "../jabronius/firmware/filesystem/JFSFile.js";
import { JFSLink } from "../jabronius/firmware/filesystem/JFSLink.js";
import { JFSRoot } from "../jabronius/firmware/filesystem/JFSRoot.js";

export interface StartupConfig {
	on: boolean;
	commands: string[];
}

const isTruthy = (s: string) => ['1','true', 'yes','yep', 'on' ].includes(s);
const isFalsey = (s: string) => ['0','false','no', 'nope','off'].includes(s);

let jfsUpdateCallback: Function | null = null;
export function jfsUpdated() {
	jfsUpdateCallback?.call(null);
}

const JFS_JSON_KEY = 'JFS_JSON';

export class BrowserModel {
	private config: StartupConfig = {
		on: true,
		commands: ['welcome']
	};

	constructor() {
		const urlConfig = this.parseInitConfigURL();
		if (urlConfig && JSON.stringify(this.config) !== JSON.stringify(urlConfig)) {
			this.config = urlConfig;
		}

		// jfsUpdateCallback = this.storeJFS;
	}

	private parseInitConfigURL = () => {
		const url = window.location.href;
		const start = url.indexOf('?') + 1;

		if (start === 0) return null;

		const end = (url.indexOf('#') + 1 || url.length + 1) - 1;
		const paramStr = url.slice(start, end);
		if (paramStr.length < 1) return null;

		const pairs = paramStr.replace(/\+/g, ' ').split('&');

		const urlConfig: StartupConfig = { on: true, commands: [] };
		pairs.forEach(pair => {
			let p = pair.split('=', 2);
			let name = decodeURIComponent(p[0]).trim(); // setting name
			let val = decodeURIComponent(p[1]); // setting value

			if (name === 'on') {
				let boolVal: boolean;
				if (isTruthy(val)) {
					boolVal = true;
				} else if (isFalsey(val)) {
					boolVal = false;
				} else {
					console.warn(`Value '${val}' is invalid for setting '${name}'. Skipping...`);
					return;
				}

				urlConfig.on = boolVal;
			}

			if (name === 'cmd') {
				urlConfig.commands.push(val);
			}
		});

		return urlConfig;
	};

	private jfsRoot: JFSRoot | null = null;

	// private loadJFS(reset?: boolean): JFSRoot {
	// 	try {
	// 		const jfs = reset ? JFS_ROOT : JSON.parse(localStorage.getItem(JFS_JSON_KEY)!!);
	// 		this.jfsRoot = this.parseJFSDir(jfs ?? JFS_ROOT);

	// 		if (reset) this.storeJFS();

	// 		// recover if scr directory is deleted, until a reset is added
	// 		if (this.jfsRoot.getContent().filter((f: JFSFile) => f.getName() === 'scr')[0]) return this.jfsRoot;
	// 		console.log('no scr dir, resetting JFS');
	// 	} catch (err) {
	// 		console.log('JFS parse failed', err);
	// 	}

	// 	this.jfsRoot = this.parseJFSDir(JFS_ROOT);
	// 	this.storeJFS();
	// 	return this.jfsRoot;
	// }

	// private storeJFS = () => {
	// 	if (!this.jfsRoot?.getContent()) {
	// 		localStorage.removeItem(JFS_JSON_KEY);
	// 		return;
	// 	}
	// 	localStorage.setItem(
	// 		JFS_JSON_KEY,
	// 		JSON.stringify(
	// 			this.jfsRoot.getContent(),
	// 			(k, v) => k === 'parent' ? undefined : v)
	// 	);
	// }

	// private parseJFSDir(dirObj: any[], dir?: JFSDirectory) { // TODO: replace this whole system, eventually
	// 	if (!dir) dir = new JFSRoot();

	// 	dirObj.forEach(f => {
	// 		if (!f) {
	// 			console.error('import file invalid');
	// 			return;
	// 		}
	// 		const name = f['name'],
	// 			type = f['type'],
	// 			content = f['content'];
	// 		let file;
	// 		switch (type) {
	// 			case JFSType.Data: {
	// 				file = new JFSFile(name, content, dir);
	// 				break;
	// 			}
	// 			case JFSType.Directory: {
	// 				file = this.parseJFSDir(content, new JFSDirectory(name, dir));
	// 				break;
	// 			}
	// 			case JFSType.Link: {
	// 				file = new JFSLink(name, content, dir);
	// 				break;
	// 			}
	// 			default: return;
	// 		}

	// 		if (!dir) {
	// 			console.error('dir undefined');
	// 			return;
	// 		}
	// 		if (typename(dir.getContent()) !== 'Array') {
	// 			console.error('dir contents not an array. setting to blank array.');
	// 			dir.setContent([]);
	// 		}
	// 		dir.addFile(file);
	// 	});

	// 	return dir;
	// }

	getStartupConfig() {
		return this.config;
	}

	// getJFSRoot() {
	// 	return this.loadJFS();
	// }
}