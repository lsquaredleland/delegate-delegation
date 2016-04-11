const margin = {top: 20, right: 20, bottom: 20, left: 20};
const h = 1000 - margin.top - margin.bottom;
const w = 1900 - margin.left - margin.right;
const sidePadding = 200;

let tip;
let currentSelectedState = null;
const peoplePerCircle = 10;
let stateData;
let usStates;

//Have a button to show how much more candidates need to win? Overlay on current total stacks?

const candidatesInfo = {
  // Meta
  totaldelegates: {label: "Total Delegates", lx: w * .35, ly: margin.top, baseColour: 'gray', stroke: 'white'},
  totalspecialdelegates: {label: "Total Special Delegates", lx: w*.65, ly: margin.top, baseColour: 'gray', stroke:'maroon'},

  // Democratic
  clinton: {label: "Clinton", lx: margin.right + sidePadding, ly: h/4, baseColour: 'rgb(119, 208, 233)'},
  sanders: {label: "Sanders", lx: w - sidePadding, ly: h/4, baseColour: 'rgb(135, 113, 179)'},
  omalley: {label: "O'Malley", lx: margin.right + sidePadding, ly: h - sidePadding, baseColour: 'rgb(246, 140, 47)'},

  // Republican / GOP
  trump: {label: "Trump", lx: margin.right + sidePadding, ly: margin.top + sidePadding, baseColour: 'rgb(254, 210, 8)'},
  cruz: {label: "Cruz", lx: w - sidePadding, ly: margin.top + sidePadding, baseColour: 'rgb(246,140,47)'},
  rubio: {label: "Rubio", lx: w - sidePadding, ly: h - sidePadding, baseColour: 'rgb(198,38,143)'},
  kasich: {label: "Kasich", lx: margin.right + sidePadding, ly: h - sidePadding, baseColour: 'rgb(109,190,74)'},
  carson: {label: "Carson", lx: w - sidePadding, ly: h*.35, baseColour: 'rgb(192,107,63)'},
  bush: {label: "Bush", lx: margin.right + sidePadding, ly: h*.35, baseColour: 'rgb(118,82,162)'},
  fiorina: {label: "Fiorina", lx: w - sidePadding, ly: h*.65, baseColour: 'rgb(0,142,130)'},
  huckabee: {label: "Huckabee", lx: margin.right + sidePadding, ly: h*.65, baseColour: 'rgb(194,165,241)'},
  paul: {label: "Paul", lx: w - sidePadding, ly: h/2, baseColour: 'rgb(232,191,128)'},
  christie: {label: "Christie", lx: margin.right + sidePadding, ly: h/2, baseColour: 'rgb(233,164,135)'},
  gilmore: {label: "Gilmore", lx: w*.75, ly: h - sidePadding/2, baseColour: 'rgb(7,168,134)'},
  santorum: {label: "Santorum", lx: w*.25, ly: h - sidePadding/2, baseColour: 'rgb(191,192,92)'}
}

// Is there data on number of votes recieved rather than percentage per state...?
const q = d3_queue.queue()
  // http://bbg-gfx.s3-website-us-east-1.amazonaws.com/auto-calendar.json
  .defer(d3.json, 'data/auto-calendar-backup.json')
  // This has meta data such as the total number of candidates etc
  // From http://www.bloomberg.com/politics/graphics/2016-delegate-tracker/data/calendar-base.csv
  .defer(d3.csv, 'data/calendar-base.csv')
  .defer(d3.csv, 'data/pop.csv')
  .defer(d3.csv, 'data/area.csv')
  .defer(d3.json, 'data/us-states.json')
  .awaitAll(function(error, data) {
    if (error) console.log(error);

    [autoCalendarBackup, calendarBase, pop, area, usStates] = data;

    stateData = _.map(autoCalendarBackup, (state) => {
      state.name = state.State;
      state.state_id = c(state.State);
      return state;
    });

    // if all arrays are sorted -> could _.merge()
    _.forEach(calendarBase, (line) => {
      const state = _.find(stateData, (state) => _.includes(state.name, line.State))
      if (!_.isUndefined(state)) {
        line.D_delegates = parseInt(line.D_delegates)
        line.R_delegates = parseInt(line.R_delegates)
        _.assign(state, line)
      }
    })
    _.forEach(pop, (line) => {
      const state = _.find(stateData, (state) => _.includes(state.name, line.NAME))
      if (!_.isUndefined(state)) {
        state.POPESTIMATE2015 = parseInt(line.POPESTIMATE2015);
        state.POPEST18PLUS2015 = parseInt(line.POPEST18PLUS2015);
        state.PCNT_POPEST18PLUS = parseFloat(line.PCNT_POPEST18PLUS);
      }
    })
    _.forEach(area, (line) => {
      const state = _.find(stateData, (state) => _.includes(state.name, line.name))
      if (!_.isUndefined(state)) {
        state.total_area_mi = Math.round(parseFloat(line.total_area_mi.replace(',','')));
        state.total_land_area_mi = Math.round(parseFloat(line.total_land_area_mi.replace(',','')));
        state.total_water_area_mi = Math.round(parseFloat(line.total_water_area_mi.replace(',','')));

        // Below method seems a tad bit excessive
        // const {total_area_mi, total_land_area_mi, total_water_area_mi} = _.mapValues(line, (i) => Math.round(parseFloat(i.replace(',',''))))
        // _.assign(state, {total_area_mi, total_land_area_mi, total_water_area_mi})
      }
    })
    loadState("GOP")
    loadState("Demo")
    generateLegend()
  });

function loadState(party) {
  const GOP = party === 'GOP';
  const results = GOP ? 'R_results' : 'D_results';
  const delegates = GOP ? 'R_delegates' : 'D_delegates';
  const candidates = GOP ? 'R_Candidates' : 'D_Candidates';
  const type = GOP ? 'R_type' : 'D_type';
  const delspecial = GOP ? 'R_delspecial' : 'D_delspecial';
  const pre = GOP ? 'R_' : 'D_';
  const precincts = GOP ? 'R_precincts' : 'D_precincts';
  const date = GOP ? 'R_date' : 'D_date';
  const aggregateCandidates = getAggregateCandidates(stateData, {results, delegates, delspecial})

  _.forEach(usStates.features, (feature) => {
    const name = feature.properties.name;
    const data = _.find(stateData, (state) => _.includes(state.name, name));
    feature.properties = data;
  })

  const svg = d3.select("#chart" + party).append('svg')
      .attr("width", w)
      .attr("height", h)
      .style({display: 'block', margin: 'auto'});
  const projection = albersUsaPr() //d3.geo.___()
      .translate([w/2, h/2])
      .scale(1600);
  const path = d3.geo.path()
      .projection(projection);
  const svgState = svg.append('g')
    .attr('class', classNames('state'))
  const voteToTexture = stateTextures(svgState);

  // base layer
  svgState.selectAll("path.base")
      .data(usStates.features)
    .enter()
      .append('path')
      .attr('class', (d) => classNames('base', d.properties.state_id))
      .attr("d", path)
      .on('click', (d) => toggleStateClick(d.properties))

  svgState.selectAll(".state")
      .data(usStates.features)
    .enter()
      .append("path")
      .attr('class', (d) => classNames('state', d.properties.state_id))
      .attr("d", path)
      .style("fill", (d) => voteToTexture[d.properties[type]].url())
      .style('pointer-events', 'none') // binding this to .state in css doesn't work
      .attr("transform", (d) => {
        const [x, y] = path.centroid(d);

        return "translate(" + x + "," + y + ")"
            + "scale(" + (d.properties.PCNT_POPEST18PLUS/100 || 0) + ")"
            + "translate(" + -x + "," + -y + ")";
      })
      .each((d) => {
        const [x, y] = path.centroid(d);
        d.properties.centroid = {x, y};
        const totaldelegates = d.properties[delegates];
        const delegated = d.properties[results];
        const state_id = d.properties.state_id;
        drawCircle(svg, {x, y, properties: d.properties,totaldelegates, delegated})
        drawArc(svg, {x, y, state_id, delegated})
      })

  // Non continental / albers projection US territories + special areas
  const nonStates = ['us_virgin_islands', 'northern_mariana_islands', 'democrats_abroad', 'american_samoa', 'guam', 'super']
  const nonGeoState = _.filter(stateData, (d, i) => _.includes(nonStates, d.state_id) && d[results] !== "");
  const [height, width] = [60, 60];
  const spacing = width + 10;
  const getRectX = (d, i) => w * .45 + i*spacing;
  svgState.selectAll("rect.base")
      .data(nonGeoState)
    .enter()
      .append("rect")
      .attr('class', (d) => classNames('base', d.state_id))
      .attr('x', getRectX)
      .attr('y', h  * .9)
      .attr({height, width})
      .on('click', toggleStateClick)
  svgState.selectAll("rect.state")
      .data(nonGeoState)
    .enter()
      .append("rect")
      .attr('class', (d) => classNames('state', d.state_id))
      .attr('x', getRectX)
      .attr('y', h  * .9)
      .attr({height, width})
      .style("fill", (d) => voteToTexture[d[type]].url())
      .style('pointer-events', 'none') // binding this to .state in css doesn't work
      .attr("transform", (d, i) => {
        const [x, y] = [w * .45 + i*spacing + width/2, h * .9 + height/2];

        return "translate(" + x + "," + y + ")"
            + "scale(" + (d.PCNT_POPEST18PLUS/100 || 1) + ")"
            + "translate(" + -x + "," + -y + ")";
      })
      .each((d, i) => {
        const [x, y] = [w * .45 + i*spacing + width/2, h * .9 + height/2];
        d.centroid = {x, y}
        const totaldelegates = d[delegates];
        const delegated = d[results];
        const state_id = d.state_id;
        drawCircle(svg, {x, y, properties: d, totaldelegates, delegated})
        drawArc(svg, {x, y, state_id, delegated})

        svgState.append('text')
          .attr({x, y: y - width/2})
          .style('text-anchor', 'start')
          .attr('transform', 'rotate(-30,' + x + ',' + y + ')')
          .text(d.State)
      })

  // Drawing candidate loc
  drawCandidates(svg, {candidates: aggregateCandidates})

  // toolTips get fucked up when zoomed in, should make custom tooltips rather than use library....
  tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset((d) => {
      const BBox = d3.select('.base.' + d.state_id).node().getBBox();
      tipOrigin = {x: BBox.x + BBox.width/2, y: BBox.y};
      topOfStack = d[delegates] / peoplePerCircle * 4;
      tipDesired = {x: d.centroid.x, y: d.centroid.y - topOfStack}

      // Issue when do not click on the state is that the original bbox is different...

      return [tipDesired.y - tipOrigin.y, tipDesired.x - tipOrigin.x]
    })
    .html((d) => {
      const candidates = _.filter(d[results], (res) => res.vote !== "0" || !res.del || !res.sdTot);
      const candidatesSorted = _.sortBy(candidates, (c) => -1*parseFloat(c.vote));
      const candidatesToDraw = _.filter(candidatesSorted, (c) => !(c.del === 0 && c.sdTot === 0 && c.vote === 0));

      // What about undelegated people? Need to say total number of them
      const specialDelegatesHaventVoted = d[delspecial] - _.reduce(candidates, (agg, c) => agg + c.sdTot, 0);
      const delegatesHaventVoted = d[delegates] - d[delspecial] - _.reduce(candidates, (agg, c) => agg + c.del, 0);
      const unvoted = {name: "Haven't Voted", del: delegatesHaventVoted, sdTot:specialDelegatesHaventVoted};
      let candidatesColumns;
      if (delegatesHaventVoted + specialDelegatesHaventVoted > 0) {
        candidatesColumns = _.concat(candidatesToDraw, unvoted);
      }

      console.log(d) // Look into GOP Wyoming -> all are special delegates?

      // A react component here would be idea....
      return '<strong id="info-title">' + d.State + ' : ' + d[date] + '</strong> <br>'
        + "<table id='info-table'>"
          + generateHeaders(candidatesColumns || candidatesToDraw)
          + generateColumn(candidatesColumns || candidatesToDraw)
        + "</table> <br>"
        + "<div id='precincts'>" + (d[precincts] || 0) + "% of precincts reporting </div>"
    });
  svg.call(tip)
}

function onStateClick(d) {
  // Show more state information + highlight all paths leaving state
  d3.selectAll('.base.' + d.state_id).style('fill', 'orange')

  d3.selectAll('.line').style({'stroke-opacity': .2});
  d3.selectAll('.line.' + d.state_id + '.delegate')
    .style({stroke: 'black', 'stroke-opacity': 1}) // Eliminate black lines?
  d3.selectAll('.line.' + d.state_id + '.special-delegate')
    .style({'stroke-opacity': 1})
  tip.show(d)
}

function onStateUnclick(state_id) {
  // Show more state information + highlight all paths leaving state
  d3.selectAll('.base.' + state_id).style('fill', '#F7F0E4')
  d3.selectAll('.line').style({'stroke-opacity': .5});

  // what is the best way to redraw arcs + their colours
  d3.selectAll('.line.' + state_id + '.delegate').style('stroke', (d) => color(d.name));
  d3.selectAll('.line.' + state_id + '.special-delegate').style('stroke', 'maroon');

  tip.hide()
}

function toggleStateClick(d) {
  if (d.state_id !== currentSelectedState ) {
    onStateUnclick(currentSelectedState)
    onStateClick(d);
    currentSelectedState = d.state_id;
  }
  else {
    onStateUnclick(currentSelectedState);
    currentSelectedState = null;
  }
}

// Encode delegate allocation -> http://www.realclearpolitics.com/epolls/2016/president/republican_delegate_count.html
// -> Proportional, winner take all, unbound, Direct Election -> different thresholds...

// Is real state outline the best approach here? -> it has a lower priority over the remained of the data
// -> really should downplay the background...
