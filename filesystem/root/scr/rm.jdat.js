let path = ARGS[1];

if (!path) {
   ERR(ARGS[0] + ': path argument required');
   return;
}

let file = SHELL.resolveFile(path);
if (!file) {
   ERR(`${path}: does not exist`);
   return;
}

return FS.removeFile(file);