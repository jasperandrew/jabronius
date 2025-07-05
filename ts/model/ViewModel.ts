import { Shell } from "../jabronius/firmware/Shell.js";
import { Keyboard, KeyInputSignal } from "../jabronius/hardware/Keyboard.js";
import { Monitor } from "../jabronius/hardware/Monitor.js";

export type MouseEventHandler    = (ev: MouseEvent)    => any | null;
export type KeyboardEventHandler = (ev: KeyboardEvent) => any | null;
export type FocusEventHandler    = (ev: FocusEvent)    => any | null;

export class ViewModel {
	private readonly displayElem = document.querySelector('#display')!!;
	private readonly lightElem = document.querySelector('#light')!!;
	private readonly lineElems: Array<HTMLSpanElement> = [];
	private readonly keyElems: { [code: string]: Element | null } = {};

	constructor(
		private readonly shell: Shell,
		monitor: Monitor,
		keyboard: Keyboard
	) {
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

	onMonitorPowerUpdated = (on: boolean) => {
		if (on !== this.displayElem.classList.contains('on')) {
			this.lightElem.classList.toggle('on');
			this.displayElem.classList.toggle('on');
		}
	}

	onMonitorLinesUpdated = (lines: string[]) => {
		if (this.lineElems.length !== lines.length)
			this.initDisplayRows(lines.length);

		for (let i = 0; i < lines.length; i++) {
			if (i >= this.lineElems.length) break;
			if (this.lineElems[i].innerHTML !== lines[i])
				this.lineElems[i].innerHTML = lines[i];
		}
	}

	onKeyboardLitKeysUpdated = (litKeys: string[]) => {
		document.querySelectorAll('.key').forEach(elem => elem.classList.remove('on'));
		for (let key of litKeys) {
			this.getKeyElem(key)?.classList.add('on');
		}
	}
}