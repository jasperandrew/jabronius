let path = ARGS[1] ?? '.';
let dir = SHELL.resolveDir(path);
if (!dir) return false;
const names = Object.keys(dir.files).map(name => dir.files[name].toString());
names.push('.');
if (dir.parent !== null) names.push('..');
OUT(names.toSorted((a,b) => a.localeCompare(b)).join('\n'));