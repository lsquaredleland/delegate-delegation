function generateLegend() {
  const svg = d3.select("#legendArea").append('svg')
      .attr("width", 1000)
      .attr("height", 150)
      .style({display: 'block', margin: 'auto'});

  const svgLegendTexture = svg.append('g')
    .attr('class', classNames('state'))
  const voteToTexture = stateTextures(svgLegendTexture);

  svgLegendTexture.selectAll('.legend-texture')
      .data(["Primary", "Caucus", "Convention"])
    .enter()
      .append('rect')
      .attr('x', (d, i) => 150*i)
      .attr({width: 100, height: 30, y: 30})
      .style("fill", (d) => voteToTexture[d].url())
      .style('stroke', 'black')
  svgLegendTexture.selectAll('.legend-texture-text')
      .data(["Primary", "Caucus", "Convention"])
    .enter()
      .append('text')
      .attr('x', (d, i) => 150*i)
      .attr('y', 30)
      .text((d) => d)


  const svgLegendStateSize = svg.append('g')
    .attr('class', classNames('state'))

  svgLegendStateSize.append('rect')
    .attr({width: 100, height: 75, y: 30, x: 450})
    .style("fill", 'none')
    .style('stroke', 'black')

  svgLegendStateSize.append('rect')
    .attr({width: 100, height: 75, y: 30, x: 450})
    .style("fill", (d) => voteToTexture['Caucus'].url())
    .attr("transform", (d) => {
      const [x, y] = [500, 30+75/2];
      return "translate(" + x + "," + y + ")"
          + "scale(" + .75 + ")"
          + "translate(" + -x + "," + -y + ")";
    })

  svgLegendStateSize.append('text')
    .attr({x: 500, y: 30, 'text-anchor': 'middle'})
    .text('% of pop. 18+')


  const svgLegendCircle = svg.append('g')
    .attr('class', classNames('state'))

  svgLegendCircle.selectAll('.legend-circle')
      .data(['maroon', 'black', 'white'])
    .enter()
      .append('circle')
      .attr('cx', (d, i) => 650 + 150*i)
      .attr('cy', 45)
      .attr('r', 10)
      .style('fill', 'gray')
      .style('stroke', (d) => d)
      .style('stroke-width', (d, i) => i%2 ? '1px' : '2px')
  svgLegendCircle.selectAll('.legend-circle-text')
      .data(['Special Delegate', 'Regular Delegate', "Hasn't Voted"])
    .enter()
      .append('text')
      .attr('x', (d, i) => 650 + 150*i)
      .attr('y', 30)
      .style('text-anchor', 'middle')
      .text((d) => d)
  svgLegendCircle.append('text')
    .attr({x: 800, y: 80, 'text-anchor': 'middle'})
    .text('Each circle is ' + peoplePerCircle + ' delegates')
}
