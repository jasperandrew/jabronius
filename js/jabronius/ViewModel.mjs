export class ViewModel {
	constructor(_monitor, _keyboard) {

		////// Private Fields /////////////////

		const _displayElem = document.querySelector('#display');
		const _lightElem = document.querySelector('#light');
		const _rowElems = [];

		const _initDisplayRows = (res_v) => {
			_rowElems.length = 0;
			const readout = document.querySelector('#readout');
			for (let i = 0; i < res_v; i++) {
				const span = document.createElement('span');
				_rowElems.push(span);
				readout.prepend(span);
			}
		};

		////// Public Fields //////////////////

		this.onMonitorUpdated = (on, rows) => {
			if (on !== _displayElem.classList.contains('on')) {
				_lightElem.classList.toggle('on');
				_displayElem.classList.toggle('on');
			}

			if (_rowElems.length !== rows.length)
				_initDisplayRows(rows.length);

			for (let i = 0; i < rows.length; i++) {
				if (i >= _rowElems.length) break;
				if (_rowElems[i].innerHTML !== rows[i])
					_rowElems[i].innerHTML = rows[i];
			}
		}

		////// Initialize /////////////////////

		document.querySelector('.button.power').onclick = _monitor.togglePower;
		_monitor.bindUpdater(this.onMonitorUpdated);
	}
}