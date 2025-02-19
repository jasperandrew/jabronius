export class Keyboard {
	 constructor(_sys) {
		  
		  ////// Private Fields /////////////////

		  let _caps = false;
		  let _passwd = false;
		  let _key_elems = {};

		  const _keyOn = (code) => {
				if (_key_elems[code] === undefined) {
					 const key = document.querySelector('.key.' + code);
					 if(!key) _key_elems[code] = null;
					 else _key_elems[code] = key;
				}
				const el = _key_elems[code];
				if (el) el.classList.add('on');
		  };

		  const _keyOff = (code) => {
				const el = _key_elems[code];
				if (el) el.classList.remove('on');
		  };

		  const _allOff = () => {
				document.querySelectorAll('.key').forEach(key => key.classList.remove('on'));
		  };

		  const _capsToggle = () => {
				_caps = !_caps;
				_key_elems['CapsLock'].classList.toggle('locked');
		  };

		  const _keyDown = (e) => {
				const event = window.event ? window.event : e;

				_sys.onKeySignal(KeyInputSignal.fromKeyboardEvent(event));

				if (!event.altKey) {
					 document.querySelector('.AltLeft').classList.remove('on');
					 document.querySelector('.AltRight').classList.remove('on');
				}

				if (!_passwd) _keyOn(event.code);
						  
				if (event.code === 'CapsLock' && !event.repeat) _capsToggle();

				event.preventDefault();

				// if(!_computer.isOn() && event.code !== undefined) return false;
				// if(['ArrowUp','ArrowDown','Tab'].indexOf(event.code) > -1) event.preventDefault();
		  };

		  const _keyUp = (e) => {
				const event = window.event ? window.event : e;
				_keyOff(event.code);
		  };


		  ////// Initialize /////////////////////

		  document.onkeydown = _keyDown;
		  document.onkeyup = _keyUp;
		  document.onblur = _allOff;
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