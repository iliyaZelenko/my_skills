import './style.css'
import './background'
import data from './data'

const width = window.innerWidth
const height = window.innerHeight
const bold = true
const black = false
const shadow = true
const multicolor = true
const hexcolor = '#0099cc'
const padding = {
  root: 20,
  nested: 5
}

const format = d3.format(',d')

const pack = data => d3.pack()
  .size([width, height])
  .padding(d => d.depth === 0 ? padding.root : padding.nested)
  (
    d3.hierarchy(data)
      .sum(d => d.size)
      .sort((a, b) => b.value - a.value)
  )

const root = pack(data)
let focus = root
let view

const fontsize = d3.scaleOrdinal()
  .domain([1, 3])
  .range([30, 20])

function setColorScheme (multi) {
  if (multi) {
    return d3.scaleOrdinal()
      .range(d3.schemeCategory10)
  }
}

const color = setColorScheme(multicolor)

function setCircleColor (obj) {
  let depth = obj.depth
  while (obj.depth > 1) {
    obj = obj.parent
  }
  let newcolor = multicolor ? d3.hsl(color(obj.data.name)) : d3.hsl(hexcolor)
  newcolor.l += depth === 1 ? 0 : depth * .1

  return newcolor
}

function setStrokeColor (obj) {
  let depth = obj.depth
  while (obj.depth > 1) {
    obj = obj.parent
  }

  return multicolor ? d3.hsl(color(obj.data.name)) : d3.hsl(hexcolor)
}

const svg = d3.select('.circles')
  .attr('viewBox', `-${width / 2} -${height / 2} ${width} ${height}`)
  .style('display', 'block')
  .style('width', width) // "calc(100% + 28px)"
  .style('height', height) // "auto"
  .style('cursor', 'pointer')
  .on('click', () => zoom(root))

const node = svg.append('g')
  .selectAll('circle')
  .data(root.descendants().slice(1))
  .enter().append('circle')
  .attr('fill', setCircleColor)
  .attr('stroke', setStrokeColor)
  .attr('box-shadow', '0 0 0 3px white')
  .attr('stroke-width', d => d.depth === 1 ? '3px' : '1px')
  .attr('pointer-events', d => !d.children ? 'none' : null)
  .on('mouseover', function () {
    d3.select(this).attr('stroke', d => d.depth === 1 ? 'yellow' : 'white')
  })
  .on('mouseout', function () {
    d3.select(this).attr('stroke', setStrokeColor)
  })
  .on('click', d => focus !== d && (zoom(d), d3.event.stopPropagation()))

const label = svg.append('g')
  .style('fill', function () {
    return black ? 'black' : 'white'
  })
  .style('text-shadow', function () {
    if (shadow) {
      return black ? '-1px 1px 5px white' : '-1px 1px 5px black'
    } else {
      return 'none'
    }
  })
  .attr('pointer-events', 'none')
  .attr('text-anchor', 'middle')
  .selectAll('text')
  .data(root.descendants())
  .enter().append('text')
  .style('fill-opacity', d => d.parent === root ? 1 : 0)
  .style('display', d => d.parent === root ? 'inline' : 'none')
  .style('font', d => fontsize(d.depth) + 'px sans-serif')
  .style('font-weight', function () {
    return bold ? 'bold' : 'normal'
  })
  .text(d => d.data.name)

zoomTo([root.x, root.y, root.r * 4])

function zoomTo (v) {
  const k = width / v[2]

  view = v

  label.attr('transform', d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k + fontsize(d.depth) / 4})`)
  node.attr('transform', d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`)
  node.attr('r', d => d.r * k)
}

function zoom (d) {
  focus = d

  const transition = svg.transition()
    .duration(d3.event.altKey ? 7500 : 750) //
    .tween('zoom', d => {
      const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 4])
      return t => zoomTo(i(t))
    })

  label
    .filter(function (d) {
      return d.parent === focus || this.style.display === 'inline'
    })
    .transition(transition)
    .style('fill-opacity', d => d.parent === focus ? 1 : 0)
    .on('start', function (d) {
      if (d.parent === focus) this.style.display = 'inline'
    })
    .on('end', function (d) {
      if (d.parent !== focus) this.style.display = 'none'
    })
}
