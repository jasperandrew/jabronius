export class Keyboard {
	constructor() {

		////// Private Fields /////////////////

		let _caps = false;
		let _passwd = false;
		const _litKeys = new Set();

		let _litKeysUpdater = null;
		const _notifyLitKeysUpdated = () => {
			_litKeysUpdater?.call(null, _litKeys);
		}

		const _capsToggle = () => {
			_caps = !_caps;
			_key_elems['CapsLock'].classList.toggle('locked');
		};

		const _keyDown = (e) => {
			const event = window.event ? window.event : e;

			if (!event.altKey) {
				_litKeys.delete('AltLeft');
				_litKeys.delete('AltRight');
			}

			if (!_passwd) _litKeys.add(event.code);

			if (event.code === 'CapsLock' && !event.repeat) _capsToggle();

			event.preventDefault();
			_notifyLitKeysUpdated();
		};

		const _keyUp = (e) => {
			const event = window.event ? window.event : e;
			_litKeys.delete(event.code);
			_notifyLitKeysUpdated();
		};


		////// Public Fields //////////////////

		this.bindToViewModel = (litKeysUpdater, bindKeyDown, bindKeyUp, bindBlur) => {
			_litKeysUpdater = litKeysUpdater;
			bindKeyDown(_keyDown);
			bindKeyUp(_keyUp);
			bindBlur(() => _litKeys.clear());
		}
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
	constructor(_char, _code, _modifiers) {
		////// Public Fields //////////////////
		this.char = _char;
		this.code = _code;
		this.modifiers = _modifiers;

		this.mod = (modCode) => {
			if (![ModShift,ModCtrl,ModAlt,ModMeta].includes(modCode)) return undefined;
			return _modifiers.includes(modCode);
		}
	}

	static fromKeyboardEvent(e) {
		const modifiers = [];
		if (e.shiftKey) modifiers.push(ModShift);
		if (e.ctrlKey) modifiers.push(ModCtrl);
		if (e.altKey) modifiers.push(ModAlt);
		if (e.metaKey || e.getModifierState("OS")) modifiers.push(ModMeta);

		let char = null;
		if (CharKeys.includes(e.code)) char = e.key;
		
		return new KeyInputSignal(char, e.code, modifiers);
	}
}