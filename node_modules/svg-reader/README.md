# svg-reader
[![Build Status](https://travis-ci.org/zxdong262/svg-reader.svg?branch=master)](https://travis-ci.org/zxdong262/svg-reader)

sync read svg icons and parse to icons object


## get
```bash
npm install svg-reader
```

## use

```javascript

const read = require('svg-reader')
var icons = read(__dirname + '/icons.svg')

/*
icons = 
{ home: 
   { name: 'home',
     width: 928,
     height: 1000,
     path: 'M786 ... 12t-4-13z',
     ascent: 850,
     svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 928 1000"><g transform="scale(1,-1) translate(0 -850)"><path d="M78 ... 4-13z"/></g></svg>' },
  link: 
   { name: 'link',
     width: 928,
     height: 1000,
     path: 'M81 ... 14z',
     ascent: 850,
     svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 928 1000"><g transform="scale(1,-1) translate(0 -850)"><path d="M81 ... 114z"/></g></svg>' },
  unlink: 
   { name: 'unlink',
     width: 928,
     height: 1000,
     path: 'M24 ... 13z',
     ascent: 850,
     svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 928 1000"><g transform="scale(1,-1) translate(0 -850)"><path d="M24 ... 5-13z"/></g></svg>' }
}

*/

//if do not need svg,  pass a option { nosvg: true } 
var icons = read(__dirname + '/icons.svg', { nosvg: true })
/*
icons = 
{ home: 
   { name: 'home',
     width: 928,
     height: 1000,
     path: 'M786 ... 12t-4-13z',
     ascent: 850},
  link: 
   { name: 'link',
     width: 928,
     height: 1000,
     path: 'M81 ... 14z',
     ascent: 850},
  unlink: 
   { name: 'unlink',
     width: 928,
     height: 1000,
     path: 'M24 ... 13z',
     ascent: 850}
}

*/
```


## test
```bash
git clone git@github.com:zxdong262/svg-reader.git
cd svg-reader
npm i
npm run test
```

## License
MIT
