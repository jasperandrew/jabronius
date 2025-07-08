import fs from 'fs';
const __dirname = import.meta.dirname;

const ROOT = [];
const MEMORY = ['','']; // first 2 lines reserved

// https://stackoverflow.com/questions/30106476/using-javascripts-atob-to-decode-base64-doesnt-properly-decode-utf-8-strings
function encodeB64(s) {
	try {
		return btoa(encodeURIComponent(s).replace(
			/%([0-9A-F]{2})/g,
			function(match, p1) {
				return String.fromCharCode(parseInt(p1, 16))
			}
		));
	} catch (err) {
		return '';
	}
}

function packMemory() {
	return MEMORY
		.map((s) => encodeB64(s))
		.join('\n');
}

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
				address: MEMORY.length,
				files: []
			};
			fsDir.push(dir);
			MEMORY.push('');
			processDir(filePath, dir.files);
			MEMORY[dir.address] = formatDriveData(dir);
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
				address: MEMORY.length
			};
			fsDir.push(file);
			MEMORY.push(formatDriveData(file, content));
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

MEMORY[0] = JSON.stringify(ROOT);
MEMORY[1] = formatDirFiles(ROOT);

fs.writeFileSync(
	__dirname + '/../ts/jfs.ts',
	`const JABRONIUS_MEMORY = \`${packMemory()}\n\`.trim();`
);