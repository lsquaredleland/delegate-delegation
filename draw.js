// Consider having a half circle rather than stacked -> easier to understand  difference between candidates
// Use a pie chart with fill of `none` if there are no delegates.... how to deal with special delegates
// -> use the border radius for the topmost??

// What if used hexagons instead of circles?
// What to do if there is only 1 or two delegates...

const peoplePerCircle = 10;

function drawCircle(svg, {x, y, properties, totaldelegates, delegated}) {
  let offset = 0;

  const numDelegated = totalDelegated(delegated);
  const numberUndelegated = totaldelegates - numDelegated;

  const undelegated = parseInt(numberUndelegated / peoplePerCircle);
  const undelegatedRemainder = numberUndelegated % peoplePerCircle;

  // Number of undelegated -> voting stuff hasn't happened yet
  const svgCircles = svg.append('g')
  drawIndividualCircle(svgCircles, {numCircles:undelegated, properties, className: 'undelegate', offset, x, y})
  offset = undelegated;

  // number of delegated
  const delegatedOrdered = _.sortBy(delegated, (candidate) => -(candidate.del + candidate.sdTot));
  _.forEach(delegatedOrdered, (delegate) => {
    const name = c(delegate.name);

    // Regular delegates
    const del = parseInt(delegate.del / peoplePerCircle);
    const delRemainder = delegate.del % peoplePerCircle;
    drawIndividualCircle(svgCircles, {numCircles:del, properties, className: 'delegate', name, offset, x, y});
    offset += del;

    // Super delegates
    const sdTot = parseInt(delegate.sdTot / peoplePerCircle);
    const sdTotRemainder = delegate.sdTot % peoplePerCircle;
    drawIndividualCircle(svgCircles, {numCircles:sdTot, properties, className: 'special-delegate', name, offset, x, y});
    offset += sdTot;

    // All the `remainders` should be placed on the top of the stack
    // or the stack should be arranged differently -> pie chart instead
  })
}

function drawIndividualCircle(svg, {numCircles, properties, className, name, offset = 0, x, y}) {
  const r = peoplePerCircle;
  const data = _.map(new Array(numCircles), () => properties);
  svg.selectAll('.circle.' + className + '.' + name)
      .data(data).enter()
    .append('circle')
      .attr("class", classNames('circle', name, className))
      .attr('cx', x)
      .attr('cy', (d, i) => y - i*4 - offset*4)
      .attr('r', r)
      .style('fill', name ? color(name) : null)
      .on('click', onStateClick)
}

function drawIndividualHex(svg, {data, className, name, offset = 0, x, y}) {
  const hexbin = d3.hexbin()
    .size([h, w]);
  const num = data
  svg.selectAll('.hex.' + className + '.' + name)
      .data(new Array(num)).enter()
    .append('path')
      .attr("class", classNames('hax', name, className))
      .style('fill', name ? color(name) : null)
      .attr("d", hexbin.hexagon(10))
      .attr("transform", (d, i) => "translate(" + x + "," + (y - i*4 - offset*4) + ") rotate(30)");
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

    const lineData = [[lx,ly], midpoint, [x,y]];

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
  // Consider using a <div> element instead of using text
  _.forEach(candidates, (data, name) => {
    const candidateInfo = candidatesInfo[c(name)];
    const isLeft = candidateInfo.lx < w/2;
    const isTopCenter = candidateInfo.ly < h/2 && candidateInfo.lx < w*.8 && candidateInfo.lx > w*.2;
    const xOffset = isLeft ? -30 : 30;
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

    drawCandidateTotals(svg, {candidates, name, data, candidateInfo, isLeft, isTopCenter, xOffset});
  })
}

function drawCandidateTotals(svg, {candidates, name, data, candidateInfo, isLeft, isTopCenter, xOffset}) {
  const numDel = 25;
  _.forEach(data, (d, type) => {
    if (type === 'del') {
      // seperate into groups of 250 people

      let {numColumns, colRemainder, dataRemainder} = getNumColAndRemainder({d, numDel});
      if (dataRemainder > 0 && numColumns === 0) { numColumns++; colRemainder++; };

      _.forEach(new Array(numColumns), (col, i) => {
        const x = candidateInfo.lx + (isLeft ? -20*i : 20*i);
        const yOffset = isTopCenter ? numDel*4 : 0;
        const y = candidateInfo.ly + yOffset;
        const isLast = i === numColumns - 1;
        const count = colRemainder > 0 && isLast ? colRemainder : numDel;
        const finalValue = isLast ? dataRemainder : null;

        drawCircleStack(svg, {data: count, x: x + xOffset, y, name, finalValue, className: 'total-'+type})
      })
    }
    else if (type === 'sdTot') {
      const delData = candidates[name]['del']
      const {numColumns: numColumnsDel} = getNumColAndRemainder({d:delData, numDel:25});
      const delOffset = (isLeft ? -20*numColumnsDel : 20*numColumnsDel);

      const yOffset = isTopCenter ? numDel*4 : 0;
      const y = candidateInfo.ly + yOffset;

      let {numColumns, colRemainder, dataRemainder} = getNumColAndRemainder({d, numDel});
      if (dataRemainder > 0 && numColumns === 0) { numColumns++; colRemainder++; };
      _.forEach(new Array(numColumns), (col, i) => {
        const x = candidateInfo.lx + (isLeft ? -20*i : 20*i);
        const isLast = i === numColumns - 1;
        const count = colRemainder > 0 && isLast ? colRemainder : numDel;
        const finalValue = isLast ? dataRemainder : null;

        drawCircleStack(svg, {data: count, x: x + xOffset + delOffset, y, name, finalValue, className: 'total-'+type})
      })
    }
  })
}

function drawCircleStack(svg, {data, className, name, offset = 0, x, y, finalValue = 0}) {
  _.forEach(new Array(data), (d, i) => {
    const r = (finalValue && data - 1 === i) ? finalValue : peoplePerCircle;
    svg.append('circle')
      .attr("class", classNames('circle', name, className))
      .attr('cx', x)
      .attr('cy', y - i*4 - offset*4)
      .attr('r', r)
      .style('fill', name ? color(name) : null)
  })
}

function getNumColAndRemainder({d, numDel=25}) {
  const data = parseInt(d/peoplePerCircle) || 0;
  const dataRemainder = d % peoplePerCircle;
  let numColumns = parseInt(data/numDel) || 0;
  const colRemainder = data % numDel;
  if (colRemainder > 0) { numColumns += 1; };
  return {numColumns, colRemainder, dataRemainder}
}
