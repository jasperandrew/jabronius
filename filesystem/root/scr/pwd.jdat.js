let dir = SHELL.resolveFile('.');
if (dir?.type !== 1) return false;
OUT(FS.getFilePath(dir));