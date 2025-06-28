import { Shell } from './firmware/Shell';
import { KeyInputSignal, Keyboard } from './hardware/Keyboard';
import { Monitor } from './hardware/Monitor';

export interface InitConfig {
	on: boolean;
	commands: Array<string>;
}

export type MouseEventHandler    = (ev: MouseEvent)    => any | null;
export type KeyboardEventHandler = (ev: KeyboardEvent) => any | null;
export type FocusEventHandler    = (ev: FocusEvent)    => any | null;

export class ViewModel {
	private readonly config: InitConfig = {
		on: true,
		commands: ['welcome']
	};

	private readonly displayElem = document.querySelector('#display')!!;
	private readonly lightElem = document.querySelector('#light')!!;
	private readonly lineElems: Array<HTMLSpanElement> = [];
	private readonly keyElems: { [code: string]: Element | null } = {};

	constructor(
		private readonly shell: Shell,
		monitor: Monitor,
		keyboard: Keyboard
	) {
		this.importSettingsFromURL();

		monitor.bindToViewModel(
			this.onMonitorPowerUpdated,
			this.onMonitorLinesUpdated,
			(f: MouseEventHandler) => (document.querySelector<HTMLDivElement>('.button.power')!!).onclick = f);

		keyboard.bindToViewModel(
			this.onKeyboardLitKeysUpdated,
			(f: KeyboardEventHandler) => this.keydown = f,
			(f: KeyboardEventHandler) => document.onkeyup = f,
			(f: FocusEventHandler) => document.onblur = f
		);

		document.onkeydown = this.onKeyDown;
	}

	private getKeyElem(code: string) {
		if (this.keyElems[code] === undefined) {
				let elem = document.querySelector('.key.' + code);
				if (!elem) elem = null;
				this.keyElems[code] = elem;
				return elem;
		}
		return this.keyElems[code];
	};

	private initDisplayRows(num_lines: number) {
		this.lineElems.length = 0;
		const readout = document.querySelector('#readout')!!;
		readout.innerHTML = '';
		for (let i = 0; i < num_lines; i++) {
			const span = document.createElement('span');
			this.lineElems.push(span);
			readout.prepend(span);
		}
	};

	keydown: Function | null = null;
	private onKeyDown = (e: KeyboardEvent) => {
		this.keydown?.call(null, e);
		this.shell.onKeySignal(KeyInputSignal.fromKeyboardEvent(e));
	};

	private importSettingsFromURL = () => {
		const url = window.location.href;
		const start = url.indexOf('?') + 1;

		if (start === 0) return;

		const end = (url.indexOf('#') + 1 || url.length + 1) - 1;
		const paramStr = url.slice(start, end);
		if (paramStr.length < 1) return;

		const pairs = paramStr.replace(/\+/g, ' ').split('&');
		const truthy = ['1','true', 'yes','yep', 'on'];
		const falsey = ['0','false','no', 'nope','off'];

		pairs.forEach(pair => {
			let p = pair.split('=', 2);
			let name = decodeURIComponent(p[0]).trim(); // setting name
			let val = decodeURIComponent(p[1]); // setting value

			if (name === 'on') {
				let boolVal: boolean;
				if (truthy.indexOf(val) > -1) {
					boolVal = true;
				} else if (falsey.indexOf(val) > -1) {
					boolVal = false;
				} else {
					console.warn(`Value '${val}' is invalid for setting '${name}'. Skipping...`);
					return;
				}

				this.config.on = boolVal;
			}

			if (name === 'cmd') {
				this.config.commands.push(val);
			}
		});
	};

	onMonitorPowerUpdated(on: boolean) {
		if (on !== this.displayElem.classList.contains('on')) {
			this.lightElem.classList.toggle('on');
			this.displayElem.classList.toggle('on');
		}
	}

	onMonitorLinesUpdated(lines: Array<string>) {
		if (this.lineElems.length !== lines.length)
			this.initDisplayRows(lines.length);

		for (let i = 0; i < lines.length; i++) {
			if (i >= this.lineElems.length) break;
			if (this.lineElems[i].innerHTML !== lines[i])
				this.lineElems[i].innerHTML = lines[i];
		}
	}

	onKeyboardLitKeysUpdated(litKeys: Array<string>) {
		document.querySelectorAll('.key').forEach(elem => elem.classList.remove('on'));
		for (let key of litKeys) {
			this.getKeyElem(key)?.classList.add('on');
		}
	}

	getConfig() {
		return this.config;
	}
}