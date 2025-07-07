export type KeySignalListener = (sig: KeyInputSignal) => void;
export type LitKeysUpdateListener = (litKeys: Set<string>) => void;

export class Keyboard {
	readonly litKeys: Set<string> = new Set();
	private caps = false;
	private passwd = false;

	readonly keySignalListeners: Set<KeySignalListener> = new Set();
	private fireKeySignal = (sig: KeyInputSignal) => this.keySignalListeners.forEach((l: KeySignalListener) => l(sig));

	readonly litKeysUpdateListeners: Set<LitKeysUpdateListener> = new Set();
	private fireLitKeysUpdated = () => this.litKeysUpdateListeners.forEach((l: LitKeysUpdateListener) => l(this.litKeys));

	// TODO: fix caps lock light
	private setCapsOn(isOn: boolean) {
		this.caps = isOn;
	};	

	private keyDown = (sig: KeyInputSignal) => {
		if (!sig.mod(ModAlt)) {
			this.litKeys.delete('AltLeft');
			this.litKeys.delete('AltRight');
		}	

		if (!this.passwd) this.litKeys.add(sig.code);

		if (sig.code === 'CapsLock') this.setCapsOn(true);

		this.fireLitKeysUpdated();
	};	

	private keyUp = (sig: KeyInputSignal) => {
		this.litKeys.delete(sig.code);
		if (sig.code === 'CapsLock') this.setCapsOn(false);
		this.fireLitKeysUpdated();
	};	

	onKeySignal = (sig: KeyInputSignal) => {
		this.fireKeySignal(sig);

		switch (sig.type) {
			case 'up': this.keyUp(sig); break;
			case 'down':
			case 'hold': this.keyDown(sig);
		}
	}
}

export const ModShift = 'Shift';
export const ModCtrl = 'Control';
export const ModAlt = 'Alt';
export const ModMeta = 'Meta';
export const CharKeys = [
	'Backquote','Digit1','Digit2','Digit3','Digit4','Digit5','Digit6','Digit7','Digit8','Digit9','Digit0','Minus','Equal',
	'KeyQ','KeyW','KeyE','KeyR','KeyT','KeyY','KeyU','KeyI','KeyO','KeyP','BracketLeft','BracketRight','Backslash',
	'KeyA','KeyS','KeyD','KeyF','KeyG','KeyH','KeyJ','KeyK','KeyL','Semicolon','Quote',
	'KeyZ','KeyX','KeyC','KeyV','KeyB','KeyN','KeyM','Comma','Period','Slash','Space'
];

export type KeyInputType = 'down' | 'up' | 'hold';
export class KeyInputSignal {
	type: KeyInputType;
	code: string;
	char: string | null;
	modifiers: string[];

	constructor(type: KeyInputType, code: string, char: string | null, modifiers: string[]) {
		this.type = type;
		this.code = code;
		this.char = char;
		this.modifiers = modifiers;
	}

	mod(modCode: string) {
		if (![ModShift,ModCtrl,ModAlt,ModMeta].includes(modCode)) return undefined;
		return this.modifiers.includes(modCode);
	}

	static fromKeyboardEvent(e: KeyboardEvent) {
		let type: KeyInputType = e.type === 'keyup' ? 'up' : 'down';
		if (e.repeat) type = 'hold';

		const modifiers = [];
		if (e.shiftKey) modifiers.push(ModShift);
		if (e.ctrlKey) modifiers.push(ModCtrl);
		if (e.altKey) modifiers.push(ModAlt);
		if (e.metaKey || e.getModifierState('OS')) modifiers.push(ModMeta);

		let char = null;
		if (CharKeys.includes(e.code)) char = e.key;
		
		return new KeyInputSignal(type, e.code, char, modifiers);
	}
}