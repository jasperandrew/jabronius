import fs from 'fs';
const __dirname = import.meta.dirname;

function importDir(path, jfsDir) {
	if (path.charAt(-1) !== '/') path += '/';
	fs.readdirSync(path).forEach(name => {
		const filePath = path + name;
		if (fs.lstatSync(filePath).isDirectory()) {
			let subDir = {
				type: 1, // 1 = directory
				name: name,
				content: []
			};
			importDir(filePath, subDir.content);
			jfsDir.push(subDir);
		} else {
			let content = fs.readFileSync(filePath).toString();
			let type = Number.parseInt(content[0]);
			content = content.replace(/\d[\n\r]+---[\n\r]+/g, '');
			
			jfsDir.push({
				type: type, // 0 = data, 2 = link
				name: name,
				content: content
			});
		}
	});
}

const JFS_ROOT = [];
console.log(__dirname);
importDir(__dirname + '/root', JFS_ROOT);
fs.writeFileSync(
	__dirname + '/../ts/jfs.ts',
	`const JFS_ROOT = ${JSON.stringify(JFS_ROOT)};`
);