import fs from 'fs';
const __dirname = import.meta.dirname;

function importDir(path, jfsDir) {
	if (path.charAt(-1) !== '/') path += '/';
	fs.readdirSync(path).forEach(fileName => {
		const filePath = path + fileName;
		if (fs.lstatSync(filePath).isDirectory()) {
			let subDir = {
				type: 1, // 1 = directory
				name: fileName,
				content: []
			};
			importDir(filePath, subDir.content);
			jfsDir.push(subDir);
		} else {
			let nameParts = fileName.split('.');
			let ext = nameParts.pop();
			let name = nameParts.join('.');
			let content = fs.readFileSync(filePath).toString();

			let type;
			switch(ext) {
				case 'jfs_lnk': {
					type = 2; break;
				}
				case 'jfs_scr':
				case 'jfs_dat':
				default: {
					type = 0;
				}
			}
			
			jfsDir.push({
				type: type,
				name: name,
				content: content
			});
		}
	});
}

const JFS_ROOT = [];
importDir(__dirname + '/root', JFS_ROOT);
fs.writeFileSync(
	__dirname + '/../ts/jfs.ts',
	`const JFS_ROOT = ${JSON.stringify(JFS_ROOT)};`
);