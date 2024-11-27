const FS_IMPORT = [
    {
        "type": "fldr",
        "name": "bin",
        "contents": [
            {
                "type": "data",
                "name": "about",
                "data": `SHELL.print('Hey, I\\'m Jasper. todo');`
            },
            {
                "type": "data",
                "name": "cat",
                "data": `const file = FS.getFileFromPath(ARGS[1], true);
if (!file) {
    SHELL.error(args[1] + ': does not exist');
    return;
}

if (file.getType().indexOf('fldr') > -1) {
    SHELL.error(args[1] + ': is a folder');
    return;
}
SHELL.print(file.getContent());`
            },
            {
                "type": "data",
                "name": "contact",
                "data": `SHELL.print('✉ <a href="mailto:jasper.q.andrew@gmail.com">jasper.q.andrew@gmail.com</a>');`
            },
            {
                "type": "link",
                "name": "cv",
                "path": "/bin/resume"
            },
            {
                "type": "data",
                "name": "help",
                "data": `SHELL.error(args[0] + ': program not implemented');`
            },
            {
                "type": "data",
                "name": "resume",
                "data": `SHELL.print('opening in new window...');
window.setTimeout(() => { window.open('http://www.jasperandrew.me/resume.pdf'); }, 500);`
            },
            {
                "type": "data",
                "name": "welcome",
                "data": `SHELL.print(util.welcome_str);`
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
                        "path": "/home/jasper/fodor/lunk"
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