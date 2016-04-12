function totalDelegated(results) {
  return _.reduce(results, (agg, res) => agg + res.del + res.sdTot, 0)
}

function specialDelegated(results) {
  return _.reduce(results, (agg, res) => agg + res.sdTot, 0)
}

function normalDelegated(results) {
  return _.reduce(results, (agg, res) => agg + res.del, 0)
}

function getAggregateCandidates(stateData, {results, delegates, delspecial}) {
  let aggregateCandidates  = {};
  aggregateCandidates['totaldelegates'] = {del:0, total: 0};
  aggregateCandidates['totalspecialdelegates'] = {sdTot:0, total: 0};

  _.forEach(stateData, (state) => {
    aggregateCandidates['totaldelegates'].total += (state[delegates] || 0);
    aggregateCandidates['totaldelegates'].del += (state[delegates] || 0);
    aggregateCandidates['totalspecialdelegates'].total += (state[delspecial] || 0);
    aggregateCandidates['totalspecialdelegates'].sdTot += (state[delspecial] || 0);

    _.forEach(state[results], (candidate) => {
      const name = c(candidate.name)
      aggregateCandidates['totaldelegates'].del -= (candidate.del || 0);
      aggregateCandidates['totalspecialdelegates'].sdTot -= (candidate.sdTot || 0);
      if (_.has(aggregateCandidates, name)) {
        aggregateCandidates[name].del += candidate.del;
        aggregateCandidates[name].sdTot += candidate.sdTot;
      }
      else {
        aggregateCandidates[name] = {
          del: candidate.del,
          sdTot: candidate.sdTot
        }
      }
    })
  })
  aggregateCandidates['totaldelegates'].total -= aggregateCandidates['totalspecialdelegates'].total;
  aggregateCandidates['totaldelegates'].del -= aggregateCandidates['totalspecialdelegates'].total;
  return aggregateCandidates
}

function color(name, stroke) {
  if (stroke) {
    return candidatesInfo[c(name)].stroke || 'black';
  }
  return candidatesInfo[c(name)].baseColour;
}

function c(str) {
  return _.lowerCase(str.replace(/[^a-zA-Z ]/g, "")).replace(/ /g,"_");
}

function stateTextures(svg) {
  // use different svg fill patterns if caucaus vs primary vs all unbound
  const diffVoteType = ["Primary", "Caucus", "Convention"]
  const primary = textures.lines()
    .thicker()
    .stroke('gray');
  const caucus = textures.lines()
    .orientation("3/8", "7/8")
    .stroke('gray');
  const convention = textures.lines()
    .orientation("7/8")
    .stroke('gray');
  svg.call(primary);
  svg.call(caucus);
  svg.call(convention);

  return _.zipObject(diffVoteType, [primary, caucus, convention])
}

function generateHeaders (candidates) {
  if (_.size(candidates) > 0) {
    return "<th>"
      + "<td>Del</td>"
      + "<td>Sp. Del</td>"
      + "<td>Votes</td>"
    + "</th>"
  }
  return ""
}

function generateColumn (candidates) {
  return _.reduce(candidates, (agg, candidate) => {
    return agg + "<tr>"
        + "<td>" + (candidate.name) + "</td>"
        + "<td>" + (candidate.del) + "</td>"
        + "<td>" + (candidate.sdTot) + "</td>"
        + "<td>" + (candidate.vote ? candidate.vote + '%' : '') + "</td>"
      + "</tr>"
  }, '');
}
