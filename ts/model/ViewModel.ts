import { CharKeys, Keyboard, KeyInputSignal } from "../jabronius/Keyboard.js";
import { Monitor } from "../jabronius/Monitor.js";

export class ViewModel {
	private readonly displayElem = document.querySelector('#display');
	private readonly lightElem = document.querySelector('#light');
	private readonly lineElems: Array<HTMLSpanElement> = [];
	private readonly keyElems: { [code: string]: Element | null } = {};

	constructor(
		private readonly monitor: Monitor,
		private readonly keyboard: Keyboard
	) {
		monitor.powerUpdateListeners.add(this.onMonitorPowerUpdated);
		monitor.linesUpdateListeners.add(this.onMonitorLinesUpdated);

		keyboard.litKeysUpdateListeners.add(this.onLitKeysUpdated);

		document.querySelector<HTMLDivElement>('.button.power')?.addEventListener('click', this.onPowerButtonClick);

		document.addEventListener('keydown', this.onKeyboardEvent);
		document.addEventListener('keyup', this.onKeyboardEvent);
		document.addEventListener('blur', this.onBlur);
	}

	private onPowerButtonClick = (e: MouseEvent) => {
		// TODO: timer for "hard reset"
		this.monitor.togglePower();
	}

	private onKeyboardEvent = (e: KeyboardEvent) => {
		this.keyboard.onKeySignal(KeyInputSignal.fromKeyboardEvent(e));
		if (CharKeys.includes(e.code)) e.preventDefault();
	}

	private onBlur = () => {
		this.onLitKeysUpdated();
		this.keyboard.litKeys.clear();
	}

	private getKeyElem(code: string) {
		if (this.keyElems[code] === undefined) {
				let elem = document.querySelector('.key.' + code);
				if (!elem) elem = null;
				this.keyElems[code] = elem;
				return elem;
		}
		return this.keyElems[code];
	}

	private initDisplayRows(num_lines: number) {
		this.lineElems.length = 0;
		const readout = document.querySelector('#readout')!!;
		readout.innerHTML = '';
		for (let i = 0; i < num_lines; i++) {
			const span = document.createElement('span');
			this.lineElems.push(span);
			readout.prepend(span);
		}
	}

	private onMonitorPowerUpdated = (isOn: boolean) => {
		if (isOn !== this.displayElem?.classList.contains('on')) {
			this.lightElem?.classList.toggle('on');
			this.displayElem?.classList.toggle('on');
		}
	}

	private onMonitorLinesUpdated = (lines: string[]) => {
		if (this.lineElems.length !== lines.length)
			this.initDisplayRows(lines.length);

		for (let i = 0; i < lines.length; i++) {
			if (i >= this.lineElems.length) break;
			if (this.lineElems[i].innerHTML !== lines[i])
				this.lineElems[i].innerHTML = lines[i];
		}
	}

	private onLitKeysUpdated = (litKeys?: Set<string>) => {
		document.querySelectorAll('.key').forEach(elem => elem.classList.remove('on'));
		if (!litKeys) return;
		for (let key of litKeys) {
			this.getKeyElem(key)?.classList.add('on');
		}
	}
}