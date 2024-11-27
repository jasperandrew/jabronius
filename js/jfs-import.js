const JFS_IMPORT = [
    {
        "type": "fldr",
        "name": "bin",
        "contents": [
            {
                "type": "data",
                "name": "about",
                "data": `shell.print('Hey, I\\'m Jasper. todo');`
            },
            {
                "type": "data",
                "name": "cat",
                "data": `const file = fs.getFileFromPath(args[1], true);
if (!file) {
    shell.error(args[1] + ': does not exist');
    return;
}

if (file.getType().indexOf('fldr') > -1) {
    shell.error(args[1] + ': is a folder');
    return;
}
shell.print(file.getData());`
            },
            {
                "type": "data",
                "name": "clear",
                "data": `shell.clearBuffer();`
            },
            {
                "type": "data",
                "name": "contact",
                "data": `shell.print('✉ <a href="mailto:jasper.q.andrew@gmail.com">jasper.q.andrew@gmail.com</a>'); return true;`
            },
            {
                "type": "link",
                "name": "cv",
                "path": "/bin/resume"
            },
            {
                "type": "data",
                "name": "echo",
                "data": `args.shift(); shell.print(args.join(' '));`
            },
            {
                "type": "data",
                "name": "help",
                "data": `shell.error(args[0] + ': program not implemented');`
            },
            {
                "type": "data",
                "name": "login",
                "data": `shell.error(args[0] + ': program not implemented');`
            },
            {
                "type": "data",
                "name": "ls",
                "data": `const list = fs.getCurDir().getData(); shell.print(Object.keys(list).toSorted((a,b) => a.localeCompare(b)).map(name => list[name].toString()));`
            },
            {
                "type": "data",
                "name": "pwd",
                "data": `shell.print(fs.getCurDir().getPath());`
            },
            {
                "type": "data",
                "name": "resume",
                "data": `shell.print('opening in new window...');
window.setTimeout(() => { window.open('http://www.jasperandrew.me/resume.pdf'); }, 500);
return true;`
            },
            {
                "type": "data",
                "name": "rm",
                "data": ``
            },
            {
                "type": "data",
                "name": "touch",
                "data": `shell.error(args[0] + ': program not implemented');`
            },
            {
                "type": "data",
                "name": "welcome",
                "data": `shell.print(util.welcome_str);`
            },
        ]
    },
    {
        "type": "fldr",
        "name": "home",
        "contents": [
            {
                "type": "fldr",
                "name": "jasper",
                "contents": [
                    {
                        "type": "data",
                        "name": "test",
                        "data": "blah"
                    },
                    {
                        "type": "link",
                        "name": "lonk",
                        "path": "fodor/lunk"
                    },
                    {
                        "type": "fldr",
                        "name": "fodor",
                        "contents": [
                            {
                                "type": "data",
                                "name": "toast",
                                "data": "toasty"
                            },
                            {
                                "type": "link",
                                "name": "lunk",
                                "path": "/home"
                            }        
                        ]
                    }        
                ]
            }
        ]
    }
];