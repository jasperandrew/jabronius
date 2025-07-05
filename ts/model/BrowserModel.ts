import { Drive } from "../jabronius/hardware/Drive.js";

export interface StartupConfig {
	on: boolean;
	commands: string[];
}

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
	private config: StartupConfig = {
		on: true,
		commands: ['welcome']
	};

	private onDataLoaded: Function | null = null;

	constructor(drive: Drive) {
		const urlConfig = this.parseInitConfigURL();
		if (urlConfig && JSON.stringify(this.config) !== JSON.stringify(urlConfig)) {
			this.config = urlConfig;
		}

		drive.bindModel(
			this.onDriveDataUpdated,
			(f: Function) => this.onDataLoaded = f
		);

		this.loadDriveData();
	}

	private onDriveDataUpdated = (data: string) => {
		// console.log(data.split('\n').map((s:string) => escape(decodeURIComponent(s))).join('\n'));
		localStorage.setItem(DRIVE_DATA_KEY, data);
	}

	private loadDriveData() {
		const data = localStorage.getItem(DRIVE_DATA_KEY) ?? DRIVE_DATA;
		this.onDataLoaded?.call(null, data);
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

	getStartupConfig() {
		return this.config;
	}

	getDriveData() {
		return this.loadDriveData();
	}
}