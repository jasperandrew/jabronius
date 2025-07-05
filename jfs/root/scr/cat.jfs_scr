let path = ARGS[1];
if (!path) {
   ERR(ARGS[0] + ': path argument required');
   return;
}
const file = SHELL.resolveFile(path);
if (!file) return;
if (file.type === 1) {
	ERR(path + ': is a directory');
	return;
}
OUT(FS.readFile(file));