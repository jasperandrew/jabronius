export class Display {
    constructor() {

        ////// Private Fields /////////////////

        let _on = false;
        let _res_h = 71;
        let _res_v = 25;
        let _rows = [];


        ////// Public Fields //////////////////

        this.togglePower = () => {
            document.querySelector('#light').classList.toggle('on');
            document.querySelector('#display').classList.toggle('on');
            _on = !_on;
        };

        this.isOn = () => _on;

        this.displayFrame = (textRows, clear=true, reversed=true) => {
            function htmlTextLength(html) {
                const el = document.createElement('span');
                el.innerHTML = html;
                return el.textContent?.length ?? 0;
            }

            if (reversed) textRows.reverse();
            for (let i = 0; i < _rows.length; i++) {
                let row = textRows[i];
                if (row !== '' && !row) {
                    if (clear) row = '';
                    else continue;
                }
                const len = htmlTextLength(row);
                if (len < _res_h) row += ' '.repeat(_res_h - len);
                _rows[i].innerHTML = row;
            }
        };


        ////// Initialize /////////////////////

        document.querySelector('.button.power').onclick = this.togglePower;

        const readout = document.querySelector('#readout');
        for (let i = 0; i < _res_v; i++) {
            const span = document.createElement('span');
            _rows.push(span);
            readout.prepend(span);
        }
    }
}