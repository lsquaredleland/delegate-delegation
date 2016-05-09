# Delegate Delegation 2016
This is a visualisation that was created for [Major League Data Challenge](http://www.majorleaguedatachallenge.com/), hosted by Graphistry.

Special thanks to bloomberg for having unprotected APIs that I am piggybacking off of, so that all the delegate data is up to date~.

## Features:
* Click on states to get further information
* Hover around to see highlighting
* Textures encode what type of voting system is used: `Primary`, `Caucus`, `Convention`
* Percentage of a texture that fills the state reflects the percentage of the population that is +18, did not look hard enough for data for the territories...
* If there is a maroon ring around the circle, then they are special delegates


## TODO:
* All notes are done inline... awk
* Transpile ES6 code to ES5...
* Consider pulling data from NYT instead - http://www.nytimes.com/interactive/2016/us/elections/primary-calendar-and-results.html

### Bugs:
* Use custom tooltips as if click on circle stack rather than state the tooltip will appear in the wrong area.

### Sources of Data:
* http://www.realclearpolitics.com/epolls/2016/president/republican_delegate_count.html
* https://www.gop.com/the-official-guide-to-the-2016-republican-nominating-process/
* https://gop.com/2016-gophq/event_schedule/?schedule_type=primary
* http://www.realclearpolitics.com/articles/2015/11/17/the_gop_race_for_delegates_an_interactive_tool.html
* http://www.bloomberg.com/politics/graphics/2016-delegate-tracker/
* http://www.thegreenpapers.com/P16/R-Alloc.phtml
* http://www.nytimes.com/interactive/2016/us/elections/primary-calendar-and-results.html
* http://predictwise.com/politics/2016-president-republican-nomination

### Sources of Inspiration:
* http://blog.apps.npr.org/2015/05/11/hex-tile-maps.html
* https://bl.ocks.org/mbostock/3081153
* http://www.progonos.com/furuti/MapProj/Normal/ProjPM/projPM.html
