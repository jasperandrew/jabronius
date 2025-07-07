let dir = SHELL.resolveDir('.');
if (!dir) return false;
OUT(FS.getFilePath(dir));