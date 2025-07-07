import fs from 'fs';
const __dirname = import.meta.dirname;

const ROOT = [];
const DRIVE_DATA = ['file struct','root dir'];

function formatDirFiles(files) {
	return files.map(f => `${f.name}/${f.address}`).join('|');
}

function formatDriveData(file, content) {
	if (file.type === 1)
		content = formatDirFiles(file.files);
	return `${file.type}${file.name}|${content}`;
}

function processDir(path, fsDir) {
	if (path.charAt(-1) !== '/') path += '/';
	fs.readdirSync(path).forEach(fileName => {
		const filePath = path + fileName;
		if (fs.lstatSync(filePath).isDirectory()) {
			let dir = {
				type: 1, // 1 = directory
				name: fileName,
				address: DRIVE_DATA.length,
				files: []
			};
			fsDir.push(dir);
			DRIVE_DATA.push('');
			processDir(filePath, dir.files);
			DRIVE_DATA[dir.address] = formatDriveData(dir);
		} else {
			let nameParts = fileName.split('.');
			nameParts.pop();
			let ext = nameParts.pop();
			let name = nameParts.join('.');
			let content = fs.readFileSync(filePath).toString();


			let type = 0; // ext === 'jdat'
			if (ext === 'jlnk') type = 2;
			
			let file = {
				type: type,
				name: name,
				address: DRIVE_DATA.length
			};
			fsDir.push(file);
			DRIVE_DATA.push(formatDriveData(file, content));
		}
	});
}

function escape(s) {
	return s
			.replaceAll('\\','\\\\')
			.replaceAll('\r','')
			.replaceAll('\n','\\n')
			.replaceAll('`','\\`')
			.replaceAll('$','\\$')
}

processDir(__dirname + '/root', ROOT);

DRIVE_DATA[0] = JSON.stringify(ROOT);
DRIVE_DATA[1] = formatDirFiles(ROOT);

fs.writeFileSync(
	__dirname + '/../ts/jfs.ts',
	`const DRIVE_DATA = \`${
		DRIVE_DATA
		.map(s => encodeURIComponent(s))
		// .map(s => escape(s))
		.join('\n')
	}\n\`.trim();`
);