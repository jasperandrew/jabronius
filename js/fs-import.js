const FS_IMPORT = [
    {
        "type": "<<folder>>",
        "name": "bin",
        "content": [
            {
                "type": "<<data>>",
                "name": "about",
                "content": `SHELL.print('Hey, I\\'m Jasper. todo');`
            },
            {
                "type": "<<data>>",
                "name": "cat",
                "content": `const file = SHELL.resolveFile(ARGS[1]);
if (!file) return;

if (file.getType() === '<<folder>>') {
    SHELL.error(ARGS[1] + ': is a directory');
    return;
}
SHELL.print(file.getContent());`
            },
            {
                "type": "<<data>>",
                "name": "contact",
                "content": `SHELL.print('✉ <a href="mailto:jasper.q.andrew@gmail.com">jasper.q.andrew@gmail.com</a>');`
            },
            {
                "type": "<<link>>",
                "name": "cv",
                "content": "/bin/resume"
            },
            {
                "type": "<<data>>",
                "name": "help",
                "content": `SHELL.error(ARGS[0] + ': program not implemented');`
            },
            {
                "type": "<<data>>",
                "name": "resume",
                "content": `SHELL.print('opening in new window...');
window.setTimeout(() => { window.open('http://www.jasperandrew.me/resume.pdf'); }, 500);`
            },
            {
                "type": "<<data>>",
                "name": "welcome",
                "content": `SHELL.print(util.welcome_str);`
            },
            {
                "type": "<<data>>",
                "name": "errtest",
                "content": `SHELL.nofunction();`
            },
        ]
    },
    {
        "type": "<<folder>>",
        "name": "home",
        "content": [
            {
                "type": "<<folder>>",
                "name": "jasper",
                "content": [
                    {
                        "type": "<<data>>",
                        "name": "test",
                        "content": "blah"
                    },
                    {
                        "type": "<<link>>",
                        "name": "lonk",
                        "content": "/home/jasper/fodor/lunk"
                    },
                    {
                        "type": "<<folder>>",
                        "name": "fodor",
                        "content": [
                            {
                                "type": "<<data>>",
                                "name": "toast",
                                "content": "toasty"
                            },
                            {
                                "type": "<<link>>",
                                "name": "lunk",
                                "content": "/home"
                            }        
                        ]
                    }        
                ]
            }
        ]
    }
];