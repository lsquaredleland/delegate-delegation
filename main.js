const margin = {top: 20, right: 20, bottom: 20, left: 20};
const h = 1100 - margin.top - margin.bottom;
const w = 1900 - margin.left - margin.right;
const sidePadding = 100;

const candidatesInfo = {
  // Meta
  totaldelegates: {label: "Total Delegates", lx: w * .35, ly: margin.top, baseColour: 'lightgray', stroke: 'white'},
  totalspecialdelegates: {label: "Total Special Delegates", lx: w*.65, ly: margin.top, baseColour: 'lightgray', stroke:'pink'},

  // Democratic
  clinton: {label: "Clinton", lx: margin.right + sidePadding, ly: h/4, baseColour: 'rgb(119, 208, 233)'},
  sanders: {label: "Sanders", lx: w - sidePadding, ly: h/4, baseColour: 'rgb(135, 113, 179)'},
  omalley: {label: "O'Malley", lx: margin.right + sidePadding, ly: h - sidePadding, baseColour: 'rgb(246, 140, 47)'},

  // Republican / GOP
  trump: {label: "Trump", lx: margin.right + sidePadding, ly: margin.top + sidePadding, baseColour: 'rgb(254, 210, 8)'},
  cruz: {label: "Cruz", lx: w - sidePadding, ly: margin.top + sidePadding, baseColour: 'rgb(246,140,47)'},
  rubio: {label: "Rubio", lx: w - sidePadding, ly: h - sidePadding, baseColour: 'rgb(198,38,143)'},
  kasich: {label: "Kasich", lx: margin.right + sidePadding, ly: h - sidePadding, baseColour: 'rgb(109,190,74)'},
  carson: {label: "Carson", lx: w - sidePadding, ly: h/4, baseColour: 'rgb(192,107,63)'},
  bush: {label: "Bush", lx: margin.right + sidePadding, ly: h/4, baseColour: 'rgb(118,82,162)'},
  fiorina: {label: "Fiorina", lx: w - sidePadding, ly: h*3/4, baseColour: 'rgb(0,142,130)'},
  huckabee: {label: "Huckabee", lx: margin.right + sidePadding, ly: h*3/4, baseColour: 'rgb(194,165,241)'},
  paul: {label: "Paul", lx: w - sidePadding, ly: h/2, baseColour: 'rgb(232,191,128)'},
  christie: {label: "Christie", lx: margin.right + sidePadding, ly: h/2, baseColour: 'rgb(233,164,135)'},
  gilmore: {label: "Gilmore", lx: w*.75, ly: h - sidePadding/2, baseColour: 'rgb(7,168,134)'},
  santorum: {label: "Santorum", lx: w*.25, ly: h - sidePadding/2, baseColour: 'rgb(191,192,92)'}
}

let stateData;

const q = d3_queue.queue()
  .defer(d3.json, 'data/auto-calendar-backup.json')
  // This has meta data such as the total number of candidates etc
  // From http://www.bloomberg.com/politics/graphics/2016-delegate-tracker/data/calendar-base.csv
  .defer(d3.csv, 'data/calendar-base.csv')
  .defer(d3.csv, 'data/pop.csv')
  .defer(d3.csv, 'data/area.csv')
  .defer(d3.json, 'data/us-states.json')
  .awaitAll(function(error, data) {
    if (error) throw error;

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
    loadState(usStates)
    console.log(stateData)
  });

function loadState(json) {
  const GOP = false;
  const results = GOP ? 'R_results' : 'D_results';
  const delegates = GOP ? 'R_delegates' : 'D_delegates';
  const candidates = GOP ? 'R_Candidates' : 'D_Candidates';
  const type = GOP ? 'R_type' : 'D_type';
  const delspecial = GOP ? 'R_delspecial' : 'D_delspecial';
  const pre = GOP ? 'R_' : 'D_';
  const aggregateCandidates = getAggregateCandidates(stateData, {results, delegates, delspecial})

  _.forEach(json.features, (feature) => {
    const name = feature.properties.name;
    const data = _.find(stateData, (state) => _.includes(state.name, name));
    feature.properties = data;
  })
  const svg = d3.select("#chartArea").append('svg')
      .attr("width", w)
      .attr("height", h)
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
      .data(json.features)
    .enter()
      .append('path')
      .attr('class', (d) => classNames('base', d.properties.state_id))
      .attr("d", path)
      .on('click', (d) => onStateClick(d.properties))

  svgState.selectAll(".state")
      .data(json.features)
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
        const totaldelegates = d.properties[delegates];
        const delegated = d.properties[results];
        const state_id = d.properties.state_id;
        drawCircle(svg, {x, y, totaldelegates, delegated})
        drawArc(svg, {x, y, state_id, delegated})
      })

  // Non continental / albers projection US territories + special areas
  const nonStates = ['us_virgin_islands', 'northern_mariana_islands', 'democrats_abroad', 'american_samoa', 'guam', 'super']
  const nonGeoState = _.filter(stateData, (d, i) => _.includes(nonStates, d.state_id));
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
      .on('click', onStateClick)
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
        const totaldelegates = d[delegates];
        const delegated = d[results];
        const state_id = d.state_id;
        drawCircle(svg, {x, y, totaldelegates, delegated})
        drawArc(svg, {x, y, state_id, delegated})

        svgState.append('text')
          .attr({x, y: y - width/2})
          .style('text-anchor', 'start')
          .attr('transform', 'rotate(-30,' + x + ',' + y + ')')
          .text(d.State)
      })

  // Drawing candidate loc
  drawCandidates(svg, {candidates: aggregateCandidates})
}

function onStateClick(d) {
  // Show more state information + highlight all paths leaving state
  d3.select('.base.' + d.state_id).style('fill', 'maroon')

  d3.selectAll('.line').style({'stroke-opacity': .2});
  d3.selectAll('.line.' + d.state_id + '.delegate')
    .style({stroke: 'black', 'stroke-opacity': 1})
  d3.selectAll('.line.' + d.state_id + '.special-delegate')
    .style({'stroke-opacity': 1})
}


// Is real state outline the best approach here? -> it has a lower priority over the remained of the data
// -> really should downplay the background...

// Find CSV with current state population + delegate information -> distinguise between different delegates
// Note there are 57 places where delegates originate from, including tiny island nations -> US Virign islands...
// If show a map of the US, need to add those elements too... or could have them on the side...

// In each state draw a circle -> shows the distribution / cut up of candidates selected for that state
// -> split top and bottom halves for bound / unbound?

// Each arc show a delegate vs vote?
// Toggle between delegate + popular vote...
// Look at the ratio between populate vote + super delegate allocation...
