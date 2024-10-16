// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();

var tmp = require('tmp');
var fs = require('fs');
const bodyParser = require("body-parser");
const fileUpload = require('express-fileupload');
var Jimp = require('jimp');
var sizeOf = require('image-size');
var potrace = require('potrace');
const read = require('svg-reader');
const ClipperLib = require('clipper-lib');
var point = require('point-at-length');
var DOMParser = require('xmldom').DOMParser;
const getBounds = require('svg-path-bounds');

var scale = 100;
var port = 3000;

// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

app.use(fileUpload());

// http://expressjs.com/en/starter/basic-routing.html
app.get('/', function(request, response) {
  response.sendFile(__dirname + '/index.html');
});

// listen for requests :)
var listener = app.listen(port, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});

app.post('/potraceImg', function(req, res){
  if(!req.files) console.log('no files uploaded')
  else{
    let imgFile = req.files.file;
    // console.log(`imgFile: ${JSON.stringify(imgFile)}`);
    let imgName = imgFile.name;
    // console.log(`imgName: ${imgName}`);
    let imgType = imgName.substring(imgName.indexOf('.'));
    // console.log(`imgType: ${imgType}`);
    
    // create temporary image
    tmp.file({postfix: imgType, keep: false, dir: "tmp"}, function _tempFileCreated(err, path, fd, cleanupCallback) {
    if (err) throw err;
    fs.writeFile(path, imgFile.data, function(err){      
     
      var imgDimensions = sizeOf(path);
      // console.log(`imgDimensions: ${imgDimensions.width} ${imgDimensions.height}`);
      // resize image to 700px
        Jimp.read(path, (err, img) => {
          if(err) throw err;
          img
            .resize(700, Jimp.AUTO) // resize to 700px
            .write(path); // save
          console.log('resize image');
          // now generate trace
           var outputs = {}; // dict to store output information to return to client
           
          // first create original path
              potrace.trace(path, {}, function(err, fullSVG){
                if(err) throw err;
                console.log('fullSVG generated');
                outputs.full = fullSVG;
                
                var fullSVGd = new DOMParser().parseFromString(fullSVG, 'text/svg').getElementsByTagName('path')[0].getAttribute('d');
                // console.log(`fullSVG points: ${point(fullSVGd).length()}`);

                var cut_params = {
                  turdSize: 25 // 25 default - ignore speckles of this size. seems to work well for 700W images from textbook
                };

                // next, create cut paths only
                potrace.trace(path, cut_params, function(err, cutSVG){
                  if(err) throw err;
                  console.log('cutSVG generated');
                  outputs.cut = cutSVG;     
                  var cutSVGd = new DOMParser().parseFromString(cutSVG, 'text/svg').getElementsByTagName('path')[0].getAttribute('d');
                  // console.log(`cutSVG points: ${point(cutSVGd).length()}`);

                  // take diff with full SVG to get just score lines
                  var scoreSVG = getScoreSVG(outputs.full, outputs.cut);
                  console.log('scoreSVG generated');
                  outputs.score = scoreSVG;

                  // clean up score lines
                  var cleanSVG = cleanPaths(scoreSVG);          
                  outputs.cleaned = cleanSVG;

                  // now compile
                  var cutSVG = new DOMParser().parseFromString(cutSVG, 'text/svg');
                  var scoreSVG = new DOMParser().parseFromString(cleanSVG, 'text/svg')

                  var cutPath = cutSVG.getElementsByTagName('path')[0];
                  var scorePath = scoreSVG.getElementsByTagName('path')[0];

                  var width = cutSVG.getElementsByTagName('svg')[0].getAttribute('width');
                  var height = cutSVG.getElementsByTagName('svg')[0].getAttribute('height');

                  var compiledSVG = `<svg width=${width} height=${height} viewBox="0 0 ${width} ${height}">`;
                  compiledSVG += cutPath;
                  compiledSVG += scorePath;
                  compiledSVG += '</svg>';

                  // console.log(`compiledSVG: ${compiledSVG}`);
                  outputs.compiled = compiledSVG;
                  console.log('compiledSVG generated');
                  
                  // delete the file
                  fs.unlink(path, (err) => {
                    if(err) throw err;
                    console.log(`${path} was deleted`);
                  });
          
                  // return output to client
                  res.send(outputs);
                }); // end cut path potrace

              }); // end original path potrace
          }); // end JIMP 
      }); // end write file
      // cleanupCallback();
    }); // end tmp file creation
  }// end else statement
}); // close potraceImg

// cleanPaths - given a fullSVG, clean up score lines
function cleanPaths(fullSVG){
  // console.log('cleanPaths');
  var svg = new DOMParser().parseFromString(fullSVG, 'text/svg');
  var svgPathD = svg.getElementsByTagName('path')[0].getAttribute('d');
  var width = svg.getElementsByTagName('svg')[0].getAttribute('width');
  var height = svg.getElementsByTagName('svg')[0].getAttribute('height');
  
   var indexes = getAllIndexes(svgPathD, "M");
  // console.log(`indexes length: ${indexes.length}`);
  
    var newSVGpathsD = "";
  
    for(var i=0; i<indexes.length; i++){
      var subPath = "";
      if(i == 0){
        // console.log('first index');
        subPath = svgPathD.substring(i, indexes[i+1]);
      }else if(i == indexes.length-1){
        // last path
        // console.log('last index');
        subPath = svgPathD.substring(indexes[i]);
      }else{
        // console.log(`substring ${indexes[i]} to ${indexes[i+1]}`);
        subPath = svgPathD.substring(indexes[i], indexes[i+1]);
      }
      // sometimes run into issue with the path not ending with Z - a quick fix here
      if(subPath.slice(-1) != "Z"){
        subPath = subPath.replaceAt(subPath.length-1, "Z");
      }
      
      // now clean the subPath
      let [left, top, right, bottom] = getBounds(subPath);
      let pathWidth = right - left;
      let pathHeight = bottom - top;
      console.log(`subPath ${subPath}`)
      // console.log(`pathWidth ${pathWidth} pathHeight ${pathHeight}`);
      if(pathHeight <=2 && pathWidth <=2){
        // dot - ignore it
        // console.log('ignoring dot');
      }else if((Math.abs(pathWidth-pathHeight) > 1) && pathWidth > 3){
        //diagonal line
        // console.log('diagonal line');
        var pts = point(subPath);
        var firstPt = pts.at(0);
        // check if x increases or decreases to determine direction of diagonal
        var secondPt = pts.at(1);
        if(firstPt[0] - secondPt[0] < 0){
          // diagonal declines left to right
          var newPath = `M${firstPt[0]} ${firstPt[1]} l${pathWidth} ${pathHeight}`;
        }else{
          // diagonal inclines left to right
          var newPath = `M${firstPt[0]} ${firstPt[1]} l${-pathWidth} ${pathHeight}`;
        }
        // console.log(`newPath: ${newPath}`);
        newSVGpathsD += (" " + newPath);
      }
      else if(pathHeight <= 3){
        // horizontal line
        // console.log('horizontal line');
        var pts = point(subPath);
        // draw a line from the original point the left-most point
        var firstPt = pts.at(0); //firstPt[0], firstPt[1] = x,y
        var newPath = `M${firstPt[0]} ${firstPt[1]} h-${pathWidth} `; // because contours are drawn counterclockwise, we subtract pathWidth
        // console.log(`newPath: ${newPath}`);
        newSVGpathsD += (" " + newPath);
    }else if(pathWidth <=3){
      // vertical line
      // console.log('vertical line');
      var pts = point(subPath);
     // draw a line from the original point to the bottom-most point
      var firstPt = pts.at(0); //firstPt[0], firstPt[1] = x,y
      var newPath = `M${firstPt[0]} ${firstPt[1]} v${pathHeight} `; // because contours are drawn counterclockwise, pathHeight is positive
      // console.log(`newPath: ${newPath}`);
      newSVGpathsD += (" " + newPath); 
    }
      // console.log('');
  }
      
  // compile a new SVG
  var newSVG = svgFromPath(newSVGpathsD, width, height); 
  // console.log(`newSVG: ${newSVG}`);
  return newSVG;  
}

// takes the difference between the full svg and cut svg to get just the score lines
function getScoreSVG(full, cut){
  // console.log('getScoreSVG');
  var subj = new DOMParser().parseFromString(full, 'text/svg');
  var clip = new DOMParser().parseFromString(cut, 'text/svg');
  
  var width = subj.getElementsByTagName('svg')[0].getAttribute('width');
  var height = subj.getElementsByTagName('svg')[0].getAttribute('height');
  
  // console.log(`full: ${full}`);
  // console.log('');
  // console.log(`cut: ${cut}`);
  
  // grab d element from path
  var subjD = subj.getElementsByTagName('path')[0].getAttribute('d'); // get path d
  var clipD = clip.getElementsByTagName('path')[0].getAttribute('d');
  
  var subjPaths = createPath(subjD);
  // console.log('got subject paths');
  var clipPaths = createPath(clipD);
  // console.log('got clip paths');
  
  ClipperLib.JS.ScaleUpPaths(subjPaths, scale);
  ClipperLib.JS.ScaleUpPaths(clipPaths, scale);
  var cpr = new ClipperLib.Clipper();
  cpr.AddPaths(subjPaths, ClipperLib.PolyType.ptSubject, true);
  cpr.AddPaths(clipPaths, ClipperLib.PolyType.ptClip, true);
  var subject_fillType = ClipperLib.PolyFillType.pftNonZero;
  var clip_fillType = ClipperLib.PolyFillType.pftNonZero;
  var clipType = ClipperLib.ClipType.ctDifference;
  var solution_paths = new ClipperLib.Paths();
  
  solution_paths = new ClipperLib.Paths();
  cpr.Execute(clipType, solution_paths, subject_fillType, clip_fillType);
  // console.log('performed clipper.js diff');
  // console.log(JSON.stringify(solution_paths));

  var newSVGPathD = paths2string(solution_paths, scale);  
  // console.log(`newSVGPathD: ${newSVGPathD}`);

  var newSVG = svgFromPath(newSVGPathD, width, height);
  // console.log(`newSVG: ${newSVG}`);
    
  return newSVG;
}

// createPath 
// create polygon path from an SVG path to use with clipper.js
function createPath(svgPathD){
  var paths = new ClipperLib.Paths();
  // split svgPathD into arrays based on closed paths
  var indexes = getAllIndexes(svgPathD, "M");
  // console.log(`indexes.length: ${JSON.stringify(indexes).length}`);
   
  var newSVGpathsD = [];
  for(i=0; i<indexes.length; i++){
    var subPath = "";
    if(i == 0){
      // console.log('first index');
      subPath = svgPathD.substring(i, indexes[i+1]);
    }else if(i == indexes.length-1){
      // last path
      // console.log('last index');
      subPath = svgPathD.substring(indexes[i]);
    }else{
      // console.log(`substring ${indexes[i]} to ${indexes[i+1]}`);
      subPath = svgPathD.substring(indexes[i], indexes[i+1]);
    }
    // sometimes run into issue with the path not ending with Z - a quick fix here
    if(subPath.slice(-1) != "Z"){
      subPath = subPath.replaceAt(subPath.length-1, "Z");
    }
    // console.log(`${i} subPath with length ${subPath.length} : ${subPath}`);
    // console.log(`----------------------`);
    newSVGpathsD.push(subPath);
  }
  
  // console.log(`newSVGpathsD: ${JSON.stringify(newSVGpathsD)}`);
  for(var x=0; x<newSVGpathsD.length; x++){
    // console.log(`path creation loop ${x}`);
    var path = new ClipperLib.Path();
    
    var pts = point(newSVGpathsD[x]);
    var len = Math.round(pts.length());

    // console.log(`path length ${len}`);
    
    // limit to 100 points
    var shift = 1;
    var limit = 100;
    if(len > limit){
      shift = Math.round(len/limit);
    }
    
    var counter = 0;
    for(var i=0; i<len; i=i+shift){
      var p = pts.at(i); 
      if(counter%100 == 0){
         // console.log(`${i} (${Math.round(i/len*100*100)/100}%) p ${JSON.stringify(p)}`);
      }
      path.push(new ClipperLib.IntPoint(p[0], p[1]));
      counter++;
    }
    // console.log(`path: ${JSON.stringify(path)}`);
    // console.log('');
    // add this array to paths
    paths.push(path);
  }
  // console.log(`paths: ${JSON.stringify(paths)}`);

  return paths; 
}

// path2strings
// takes paths from clipper.js and converts them to svg paths
function paths2string (paths, scale) {
  var svgpath = "", i, j;
  if (!scale) scale = 1;
  for(i = 0; i < paths.length; i++) {
    for(j = 0; j < paths[i].length; j++){
      if (!j) svgpath += "M";
      else svgpath += "L";
      svgpath += (paths[i][j].X / scale) + ", " + (paths[i][j].Y / scale);
    }
    svgpath += "Z";
  }
  // if (svgpath=="") svgpath = "M0,0";
  return svgpath;
}

// svgFromPath(path)
// create an SVG from a given path
function svgFromPath(path, width, height){
  var svg = `<svg width=${width} height=${height} viewBox="0 0 ${width} ${height}">`;
  svg += '<path stroke="black" stroke-width="1" d="' + path + '"/>';
  svg += '</svg>';
  return svg;
}

// getAllIndexes
// find indexes of all occurences of val within a string
function getAllIndexes(arr, val) {
    var indexes = [], i;
    for(i = 0; i < arr.length; i++)
        if (arr[i] === val)
            indexes.push(i);
    return indexes;
}

String.prototype.replaceAt=function(index, replacement) {
    return this.substr(0, index) + replacement+ this.substr(index + replacement.length);
}
