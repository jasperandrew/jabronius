export class Keyboard {
	private readonly litKeys = new Set();
	private caps = false;
	private passwd = false;

	private litKeysUpdater: Function | null = null;
	private notifyLitKeysUpdated() {
		this.litKeysUpdater?.call(null, this.litKeys);
	}

	private capsToggle() {
		this.caps = !this.caps;
		// TODO: send caps lock signal
		// _key_elems['CapsLock'].classList.toggle('locked');
	};

	private keyDown(e: KeyboardEvent) {
		if (!e.altKey) {
			this.litKeys.delete('AltLeft');
			this.litKeys.delete('AltRight');
		}

		if (!this.passwd) this.litKeys.add(e.code);

		if (e.code === 'CapsLock' && !e.repeat) this.capsToggle();

		e.preventDefault();
		this.notifyLitKeysUpdated();
	};

	private keyUp(e: KeyboardEvent) {
		this.litKeys.delete(e.code);
		this.notifyLitKeysUpdated();
	};

	bindToViewModel(litKeysUpdater: Function | null, bindKeyDown: Function, bindKeyUp: Function, bindBlur: Function) {
		this.litKeysUpdater = litKeysUpdater;
		bindKeyDown(this.keyDown);
		bindKeyUp(this.keyUp);
		bindBlur(() => this.litKeys.clear());
	}
}

export const ModShift = "Shift";
export const ModCtrl = "Control";
export const ModAlt = "Alt";
export const ModMeta = "Meta";
export const CharKeys = [
	'Backquote','Digit1','Digit2','Digit3','Digit4','Digit5','Digit6','Digit7','Digit8','Digit9','Digit0','Minus','Equal',
	'KeyQ','KeyW','KeyE','KeyR','KeyT','KeyY','KeyU','KeyI','KeyO','KeyP','BracketLeft','BracketRight','Backslash',
	'KeyA','KeyS','KeyD','KeyF','KeyG','KeyH','KeyJ','KeyK','KeyL','Semicolon','Quote',
	'KeyZ','KeyX','KeyC','KeyV','KeyB','KeyN','KeyM','Comma','Period','Slash','Space'
];

export class KeyInputSignal {
	code: string;
	char: string | null;
	modifiers: Array<string>;

	constructor(code: string, char: string | null, modifiers: Array<string>) {
		this.code = code;
		this.char = char;
		this.modifiers = modifiers;
	}

	mod(modCode: string) {
		if (![ModShift,ModCtrl,ModAlt,ModMeta].includes(modCode)) return undefined;
		return this.modifiers.includes(modCode);
	}

	static fromKeyboardEvent(e: KeyboardEvent) {
		const modifiers = [];
		if (e.shiftKey) modifiers.push(ModShift);
		if (e.ctrlKey) modifiers.push(ModCtrl);
		if (e.altKey) modifiers.push(ModAlt);
		if (e.metaKey || e.getModifierState("OS")) modifiers.push(ModMeta);

		let char = null;
		if (CharKeys.includes(e.code)) char = e.key;
		
		return new KeyInputSignal(e.code, char, modifiers);
	}
}