let path = ARGS[1];
if (!path) {
   ERR(ARGS[0] + ': path argument required');
   return;
}

if (SHELL.resolveFile(path)) {
   ERR(`${path}: already exists`);
   return;
}

if (!path.startsWith('/')) {
   path = FS.getFilePath(SHELL.resolveFile('.')) + '/' + path;
};

return FS.createFile(path);