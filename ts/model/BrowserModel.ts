import { Memory } from "../jabronius/Memory.js";
import { StartupConfig, SystemHub } from "../jabronius/SystemHub.js";

const isTruthy = (s: string) => ['1','true', 'yes','yep', 'on' ].includes(s);
const isFalsey = (s: string) => ['0','false','no', 'nope','off'].includes(s);

const DRIVE_DATA_KEY = 'JABRONIUS_DRIVE_DATA';

function escape(s: string) {
	return s
			.replaceAll('\\','\\\\')
			.replaceAll('\r','')
			.replaceAll('\n','\\n')
			.replaceAll('`','\\`')
			.replaceAll('$','\\$')
}

export class BrowserModel {
	constructor(
		hub: SystemHub,
		memory: Memory
	) {
		memory.memoryUpdatedListeners.add(this.onMemoryUpdated);
		memory.initMemory(localStorage.getItem(DRIVE_DATA_KEY) ?? DRIVE_DATA);

		hub.startupSystem(this.parseStartupConfigURL());
	}

	private onMemoryUpdated = (memData: string) => {
		// console.log(data.split('\n').map((s:string) => escape(decodeURIComponent(s))).join('\n'));
		localStorage.setItem(DRIVE_DATA_KEY, memData);
	}

	private parseStartupConfigURL = () => {
		const url = window.location.href;
		const start = url.indexOf('?') + 1;

		if (start === 0) return null;

		const end = (url.indexOf('#') + 1 || url.length + 1) - 1;
		const paramStr = url.slice(start, end);
		if (paramStr.length < 1) return null;

		const pairs = paramStr.replace(/\+/g, ' ').split('&');

		const config: StartupConfig = { on: true, commands: [] };
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

				config.on = boolVal;
			}

			if (name === 'cmd') {
				config.commands.push(val);
			}
		});

		return config;
	}
}