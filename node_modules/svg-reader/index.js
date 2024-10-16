

const cheerio = require('cheerio')

/*
 * @param {string} svgPath
 * @param {object} _options, default is { nosvg: false }
 */

module.exports = function(svgPath, _options) {

	var options = Object.assign({
		nosvg: false
	}, _options)
	var str = require('fs').readFileSync(svgPath, 'utf-8')
	var $ = cheerio.load(str)
	var fontFace = $('font-face')
	var defaultWidth = parseInt($('font').attr('horiz-adv-x'), 10) || 0
	var defaultHeight = parseInt(fontFace.attr('units-per-em'), 10) || 0
	var defaultAscent = parseInt(fontFace.attr('ascent'), 10) || 0
  var defaultDescent = parseInt(fontFace.attr('descent'), 10) || 0
	var glyphs = $('glyph')
	var icons = {}

	glyphs.each(function(i) {
		var t = $(this)
		,name = t.attr('glyph-name') || Math.random() + ''
		,hx = t.attr('horiz-adv-x')
		,width = hx?parseInt(hx, 10):defaultWidth
		,height = defaultHeight
		,path = t.attr('d')

		var obj = {
			name: t.attr('glyph-name')
			,width: width
			,height: height
			,path: path
			,ascent: defaultAscent
      ,descent: defaultDescent
		}

		//from https://github.com/eugene1g/font-blast/blob/develop/lib/font-blast/glyph-extractor.js
		if(!options.nosvg) obj.svg = (
				`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><g transform="scale(1,-1) translate(0 -${defaultAscent})"><path d="${path}"/></g></svg>`
			)

		icons[name] = obj
	})

	return icons
}