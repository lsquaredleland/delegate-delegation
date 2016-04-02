// Consider having a half circle rather than stacked -> easier to understand  difference between candidates
// Use a pie chart with fill of `none` if there are no delegates.... how to deal with special delegates
// -> use the border radius for the topmost??

// What if used hexagons instead of circles?
// What to do if there is only 1 or two delegates...
function drawCircle(svg, {x, y, totaldelegates, delegated}) {
  const peoplePerCircle = 10;
  let offset = 0;

  const numDelegated = totalDelegated(delegated);
  const numberUndelegated = totaldelegates - numDelegated;

  const undelegated = parseInt(numberUndelegated / peoplePerCircle);
  const undelegatedRemainder = numberUndelegated % peoplePerCircle;

  // Number of undelegated -> voting stuff hasn't happened yet
  const svgCircles = svg.append('g')
  drawIndividualCircle(svgCircles, {data:undelegated, className: 'undelegate', offset, x, y})
  offset = undelegated;

  // number of delegated
  const delegatedOrdered = _.sortBy(delegated, (candidate) => -(candidate.del + candidate.sdTot));
  _.forEach(delegatedOrdered, (delegate) => {
    const name = c(delegate.name);

    // Regular delegates
    const del = parseInt(delegate.del / peoplePerCircle);
    const delRemainder = delegate.del % peoplePerCircle;
    drawIndividualCircle(svgCircles, {data:del, className: 'delegate', name, offset, x, y});
    offset += del;

    // Super delegates
    const sdTot = parseInt(delegate.sdTot / peoplePerCircle);
    const sdTotRemainder = delegate.sdTot % peoplePerCircle;
    drawIndividualCircle(svgCircles, {data:sdTot, className: 'special-delegate', name, offset, x, y});
    offset += sdTot;

    // All the `remainders` should be placed on the top of the stack
    // or the stack should be arranged differently -> pie chart instead
  })
}

function drawIndividualCircle(svg, {data, className, name, offset = 0, x, y, isRemainder = false}) {
  //const hexbin = d3.hexbin()
    //.size([h, w]);
  const r = !isRemainder ? 10 : data;
  const num = !isRemainder ? data : 1;
  svg.selectAll('.circle.' + className + '.' + name)
      .data(new Array(num)).enter()
    .append('circle')
      .attr("class", classNames('circle', name, className))
      .attr('cx', x)
      .attr('cy', (d, i) => y - i*4 - offset*4)
      .attr('r', r)
      .style('fill', name ? color(name) : null)
      //.attr("d", hexbin.hexagon(10))
      //.attr("transform", (d, i) => "translate(" + x + "," + (y - i*4 - offset*4) + ") rotate(30)");
}

// Need to add more padding to overall svg in orer make space for the arcs
// Might want to animate on some user interaction, arrows fly as things load...
const line = d3.svg.line()
  .x((d) => d[0])
  .y((d) => d[1])
  .interpolate('basis');
const strokeWidthModifier = 10;

function drawArc(svg, {x, y, state_id, delegated}) {
  const svgArcs = svg.append('g')
    .attr('class', classNames('arcs'));

  _.forEach(delegated, (candidate) => {
    const name = c(candidate.name);
    const {lx, ly} = candidatesInfo[name];

    // Might want to run a bundling algorithm ontop of the paths

    const dist = Math.sqrt(Math.pow(lx-x,2) + Math.pow(ly-y,2));
    const midpoint = [(lx+x)/2 + Math.log(dist)*10, (ly+y)/2 - Math.log(dist)*10]

    const lineData = [[lx,ly], midpoint, [x,y]]

    svgArcs.append("path")
      .attr("class", classNames('line', state_id, name, 'delegate'))
      .style('stroke', color(name))
      .style('stroke-width', candidate.del / strokeWidthModifier)
      .attr("d", line(lineData));

    // Special delegate use case -> use dash line perhaps?
    svgArcs.append('path')
      .attr("class", classNames('line', state_id, name, 'special-delegate'))
      .style('stroke-width', candidate.sdTot / strokeWidthModifier)
      .attr("d", line(lineData));
  })
}

function drawCandidates(svg, {candidates}) {
  _.forEach(candidates, (data, name) => {
    const candidateInfo = candidatesInfo[c(name)];
    const isLeft = candidateInfo.lx < w/2;
    const isTopCenter = candidateInfo.ly < h/2 && candidateInfo.lx < w*.8 && candidateInfo.lx > w*.2;
    const xOffset = isLeft ? -30 : 30;
    const yOffset = isTopCenter ? 100 : 0;
    const loc = candidatesInfo[c(name)];
    const dim = 25;
    svg.append('rect')
      .attr({x: loc.lx - dim/2, y: loc.ly - dim/2, width: dim, height: dim, rx: 5})
      .style({fill: color(name), stroke: color(name, true), 'stroke-width': '2px'})
      .on('mouseover', (d) => {
        d3.selectAll('.line.' + name).style('stroke-opacity', 1);
      })
      .on('mouseout', (d) => {
        d3.selectAll('.line.' + name).style('stroke-opacity', .5);
      })
    svg.append('text')
      .attr({x: loc.lx - xOffset/2, y: loc.ly})
      .style('text-anchor', isLeft ? 'start' : 'end')
      .text(candidatesInfo[c(name)].label)
    _.forEach(data, (d, i) => { // Need to seperate special delegates + normal delegates, rename special delegates
      const data = parseInt(d/10) || 0;
      const dataRemainder = d%10;
      drawIndividualCircle(svg, {data, x: candidateInfo.lx + xOffset, y: candidateInfo.ly + yOffset, name, className: 'total'})
      drawIndividualCircle(svg, {data: dataRemainder, isRemainder: true, x: candidateInfo.lx + xOffset*1.25, y: candidateInfo.ly + yOffset, name, className: 'total'})
    })
  })
}
