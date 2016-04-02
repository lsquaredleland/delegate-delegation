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
  aggregateCandidates['totaldelegates'] = {del:0};
  aggregateCandidates['totalspecialdelegates'] = {sdTot:0};

  _.forEach(stateData, (state) => {
    aggregateCandidates['totaldelegates'].del += !_.isUndefined(state[delegates]) ? state[delegates] : 0;
    aggregateCandidates['totalspecialdelegates'].sdTot += !_.isUndefined(state[delspecial]) ? state[delspecial] : 0;
    _.forEach(state[results], (candidate) => {
      const name = c(candidate.name)
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
  return aggregateCandidates
}

function color(name, stroke) {
  if (stroke) {
    return candidatesInfo[c(name)].stroke || 'none';
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
  const caucus = textures.lines()
    .orientation("3/8", "7/8");
  const convention = textures.lines()
    .orientation("7/8");
  svg.call(primary);
  svg.call(caucus);
  svg.call(convention);

  return _.zipObject(diffVoteType, [primary, caucus, convention])
}
