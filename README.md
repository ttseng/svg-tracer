SVG Tracer
=================

This application creates a vector graphic (SVG) from bitmap input (PNG).  

It's specifically designed for interpreting crease patterns that contain a mix of solid and dashed lines.  It will export an SVG that contains two paths: one containing the solid lines, and one containing dashed lines.  This allows you to send the SVG directly to a laser cutter or any other desktop cutter (after specifying the cut settings for each type of path, of course!).

To use, follow these general steps:

1. Take a photograph of the diagram you want to process.
2. Use software like Preview to subtract any background from the image so you are left with a PNG containing only the lines.
3. Upload the cleaned image to the app.
4. Export the SVG and send to your cutting machine!

Created by [@scientiffic](https://twitter.com/scientiffic) at [Recurse](https://www.recurse.com/) using [Potrace](http://potrace.sourceforge.net/) and [Clipper.js](https://sourceforge.net/p/jsclipper/wiki/Home%206/)


