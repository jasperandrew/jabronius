OUT('opening in new window...');
let id = setTimeout(() => {
   open('http://www.jasperandrew.me/resume.pdf');
   clearTimeout(id);
}, 500);