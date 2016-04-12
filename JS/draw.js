// Consider having a half circle rather than stacked -> easier to understand  difference between candidates
// Use a pie chart with fill of `none` if there are no delegates.... how to deal with special delegates
// -> use the border radius for the topmost??

// What if used hexagons instead of circles?
// What to do if there is only 1 or two delegates...

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

    svgArcs.append("path").datum({name})
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

function candidateMouseover(name) {
  d3.selectAll('.line').style({'stroke-opacity': .2});
  d3.selectAll('.line.' + name).style('stroke-opacity', 1);
  d3.selectAll('.label-' + name).style('font-weight', 'bold');
}

function candidateMouseout(name) {
  d3.selectAll('.line').style('stroke-opacity', .5);
  d3.selectAll('.label-' + name).style('font-weight', 'normal');
}

function drawCandidates(svg, {candidates}) {
  // Consider using a <div> element instead of using text
  console.log(candidates)

  _.forEach(candidates, (data, name) => {
    const candidateInfo = candidatesInfo[name];
    const isLeft = candidateInfo.lx < w/2;
    const isTopCenter = candidateInfo.ly < h/2 && candidateInfo.lx < w*.8 && candidateInfo.lx > w*.2;
    const xOffset = isLeft ? -30 : 30;
    const loc = candidatesInfo[name];
    const dim = 25;
    svg.append('rect')
      .attr({x: loc.lx - dim/2, y: loc.ly - dim/2, width: dim, height: dim, rx: 5})
      .style({fill: color(name), stroke: color(name, true), 'stroke-width': '2px'})
      .on('mouseover', () => candidateMouseover(name))
      .on('mouseout', () => candidateMouseout(name))
    svg.append('text')
      .attr('class', classNames('title-label-' + name))
      .attr({x: loc.lx - xOffset/2, y: loc.ly})
      .style('text-anchor', isLeft ? 'start' : 'end')
      .style('font-weight', 'bold')
      .text(candidatesInfo[name].label)

    drawCandidateTotals(svg, {candidates, name, data, candidateInfo, isLeft, isTopCenter, xOffset});

    const isTotalDelegates = name === 'totaldelegates';
    const isTotalSpecialDelegates = name === 'totalspecialdelegates'
    let textAnchor = (isLeft) ? 'end' : 'start';
    if (isTopCenter) {
      textAnchor = textAnchor === 'end' ? 'start' : 'end';
    }
    let y = loc.ly + 30;
    const x = loc.lx - xOffset/2;
    if (!_.isUndefined(data.del)) {
      const textToAdd = (isTotalDelegates || isTotalSpecialDelegates) ? ' Unallocated' : '';
      appendCandidateDataText(svg, {x, y, textAnchor, name, text:"Delegates" + textToAdd + ": " + data.del});
      y += 20;
    }
    if (!_.isUndefined(data.sdTot)) {
      const textToAdd = (isTotalDelegates || isTotalSpecialDelegates) ? ' Unallocated' : '';
      appendCandidateDataText(svg, {x, y, textAnchor, name, text:"Special Delegates" + textToAdd + ": " + data.sdTot});
      y += 20;
    }
    if (!_.isUndefined(data.sdTot) && !_.isUndefined(data.del)) {
      appendCandidateDataText(svg, {x, y, textAnchor, name, text:"Total Delegates: " + (data.del + data.sdTot)});
      y += 20;
    }
    if (isTotalDelegates) {
      appendCandidateDataText(svg, {x, y, textAnchor, name, text:"Delegates Allocated: " + (data.total - data.del)}); //this is too small...
      y += 20;
      appendCandidateDataText(svg, {x, y, textAnchor, name, text:"Total Delegates: " + (data.total)});
      y += 20;
    }
    if (isTotalSpecialDelegates) {
      appendCandidateDataText(svg, {x, y, textAnchor, name, text:"Special Delegates Allocated: " + (data.total - data.sdTot)});
      y += 20;
      appendCandidateDataText(svg, {x, y, textAnchor, name, text:"Total Special Delegates: " + (data.total)});
      y += 20;
    }
  })
}

function appendCandidateDataText(svg, {x, y, name, textAnchor, text}) {
  svg.append('text')
    .attr({x, y, class: 'label-' + name})
    .style('text-anchor', textAnchor)
    .text(text)
    .on('mouseover', () => candidateMouseover(name))
    .on('mouseout', () => candidateMouseout(name))
}

function drawCandidateTotals(svg, {candidates, name, data, candidateInfo, isLeft, isTopCenter, xOffset}) {
  const numDel = 25;
  _.forEach(data, (d, type) => {
    if (type === 'del') {
      // seperate into groups of 250 people

      let {numColumns, colRemainder, dataRemainder} = getNumColAndRemainder({d, numDel});
      if (dataRemainder > 0 && numColumns === 0) { numColumns++; colRemainder++; };

      const yOffset = isTopCenter ? numDel*4 : 0;
      const y = candidateInfo.ly + yOffset;
      const className = name === 'totaldelegates' ? 'total-undel' : 'total-'+type;
      _.forEach(new Array(numColumns), (col, i) => {
        const x = candidateInfo.lx + (isLeft ? -peoplePerCircle*2*i : peoplePerCircle*2*i);
        const isLast = i === numColumns - 1;
        const count = colRemainder > 0 && isLast ? colRemainder : numDel;
        const finalValue = isLast ? dataRemainder : null;

        drawCircleStack(svg, {data: count, x: x + xOffset, y, name, finalValue, className})
      })
    }
    else if (type === 'sdTot') {
      const delData = candidates[name]['del']
      const {numColumns: numColumnsDel} = getNumColAndRemainder({d:delData, numDel:25});
      const delOffset = (isLeft ? -peoplePerCircle*2*numColumnsDel : peoplePerCircle*2*numColumnsDel);

      const yOffset = isTopCenter ? numDel*4 : 0;
      const y = candidateInfo.ly + yOffset;

      let {numColumns, colRemainder, dataRemainder} = getNumColAndRemainder({d, numDel});
      if (dataRemainder > 0 && numColumns === 0) { numColumns++; colRemainder++; };
      _.forEach(new Array(numColumns), (col, i) => {
        const x = candidateInfo.lx + (isLeft ? -peoplePerCircle*2*i : peoplePerCircle*2*i);
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
      .on('mouseover', () => candidateMouseover(name))
      .on('mouseout', () => candidateMouseout(name))
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
