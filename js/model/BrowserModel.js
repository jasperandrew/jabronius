const isTruthy = (s) => ['1', 'true', 'yes', 'yep', 'on'].includes(s);
const isFalsey = (s) => ['0', 'false', 'no', 'nope', 'off'].includes(s);
const MEMORY_KEY = 'JABRONIUS_MEMORY';
function escape(s) {
    return s
        .replaceAll('\\', '\\\\')
        .replaceAll('\r', '')
        .replaceAll('\n', '\\n')
        .replaceAll('`', '\\`')
        .replaceAll('$', '\\$');
}
export class BrowserModel {
    constructor(hub, memory) {
        memory.memoryUpdatedListeners.add(this.onMemoryUpdated);
        memory.initMemory(localStorage.getItem(MEMORY_KEY) ?? JABRONIUS_MEMORY);
        hub.startupSystem(this.parseStartupConfigURL());
    }
    onMemoryUpdated = (memData) => {
        // console.log(data.split('\n').map((s:string) => escape(decodeURIComponent(s))).join('\n'));
        localStorage.setItem(MEMORY_KEY, memData);
    };
    parseStartupConfigURL = () => {
        const url = window.location.href;
        const start = url.indexOf('?') + 1;
        if (start === 0)
            return null;
        const end = (url.indexOf('#') + 1 || url.length + 1) - 1;
        const paramStr = url.slice(start, end);
        if (paramStr.length < 1)
            return null;
        const pairs = paramStr.replace(/\+/g, ' ').split('&');
        const config = { on: true, commands: [] };
        pairs.forEach(pair => {
            let p = pair.split('=', 2);
            let name = decodeURIComponent(p[0]).trim(); // setting name
            let val = decodeURIComponent(p[1]); // setting value
            if (name === 'on') {
                let boolVal;
                if (isTruthy(val)) {
                    boolVal = true;
                }
                else if (isFalsey(val)) {
                    boolVal = false;
                }
                else {
                    console.warn(`Value '${val}' is invalid for setting '${name}'. Skipping...`);
                    return;
                }
                config.on = boolVal;
            }
            if (name === 'cmd') {
                config.commands.push(val);
            }
        });
        return config;
    };
}
