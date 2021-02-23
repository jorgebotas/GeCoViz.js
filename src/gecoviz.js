var GeCoViz = function(selector) {
  var unfData = [];
  var data = [];
  var newick;
  var newickFields;
  var anchors = [];
  var nSide = 2;
  var width = 700;
  var height = 700;
  var margin = {
      top : 10,
      left : 10,
  }
  var showName = "";
  var notation = "";
  var notationLevel;
  var excludedNotation = [];
  var excludedAnchors = [];
  var URLs = {
      kegg : {
          b : 'https://www.kegg.jp/dbget-bin/www_bget?map',
          a : ''},
      unigene : {
          b : 'http://gmgc.embl.de/search.cgi?search_id=GMGC10.',
          a : '.UNKNOWN&search_seq='
      },
      eggnog : {
          b : 'http://eggnog5.embl.de/#/app/results?target_nogs=',
          a : ''
      },
      pfam : {
          b : 'https://pfam.xfam.org/family/',
          a : ''
      },
      taxonomy : {
          b : 'https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?mode=Info&id=',
          a : '&&lvl=3&lin=f&keep=1&srchmode=1&unlock'
      }
  }
  var duration = 500;
  var delay = {
      enter : duration * 2,
      update : duration,
      exit: 0,
  }
  var geneRect = { w: width / (2 * nSide + 1), h: 17, ph: 20, pv: 5 };
  var domain = [];
  var palette = buildPalette(domain);
  var updateGenes,
        updateShowName,
        updateNotation,
        updateLegend,
        updateWidth,
        updateHeight;
  var options = {
      showName : true,
      showTree : true,
  }
  // Color variables
  var color = {
      primary : 'var(--indigo)',
      noData: 'var(--nodata)',
      highlight : 'var(--highlight)',
      black : 'var(--black)',
      white : 'var(--white)',
      darkGray : 'var(--dark-gray)',
      sand : 'var(--sand)',
      darkPurple : 'var(--dark-purple)',
      purple : 'var(--purple)',
  }
  var leafColor = {
      stroke : color.purple,
      fill : color.sand,
  }

  function chart(selection) {
    selection.each(function() {
        function getY(d) {
            let y;
            try {
                let cleaned = cleanString(d.anchor);
                cleaned = cleaned.replaceAll('_', '');
                y = d3.select(selector
                            + ' #leaf'
                            + cleanString(d.anchor)).node().__data__.x
                //y = d3.select(selector
                            //+ ' #leaf'
                            //+ cleanString(d.anchor))
                        //.node()
                        //.getBoundingClientRect()
                        //.top
                    //- d3.select(selector + ' .phylogram')
                        //.node()
                        //.getBoundingClientRect()
                        //.top;
                return y - 11;
            }
            catch {}
            return anchors.indexOf(d.anchor) * geneRect.h
        }

        function getShowName(d) {
            let geneName = d[showName];
            if(["", "NA", undefined].every(i => i != geneName)){
                let size = +Math.floor(geneRect.w / 13.5);
                let name = d[showName];
                if (size < name.length){
                    name = name.slice(0, size);
                }
                geneName = name;
            } else { geneName = "." }
            return geneName;
        }

        updateShowName = function() {
            d3.selectAll('text.geneName')
                .transition()
                .duration(duration)
                .style('opacity', 0)
                .transition()
                .duration(duration)
                .style('opacity', g => options.showName
                    && getShowName(g) != "."
                        ? 1 : 0)
                .text(getShowName);
        }

        function treeLeafEnter(l) {
            chart.excludeAnchor(l.data.name, false)
        }

        function treeLeafExit(l) {
            chart.excludeAnchor(l.data.name, true)
        }

        function treeLeafMouseOver(_, l) {
            let anchor = cleanString(l.data.name);
            let genes = graphContainer
                .selectAll(`[id^="gene${anchor}"]`)
            genes
                .select('.stroke')
                .style('opacity', 1);
        }

        function treeLeafMouseLeave(_, l) {
            let anchor = cleanString(l.data.name);
            let genes = graphContainer
                .selectAll(`[id^="gene${anchor}"]`)
            genes
                .select('.stroke')
                .style('opacity', 0);
        }

        function treeLeafClick(event, l) {
            if (event.altKey) {
                let name = l.data.name;
                let excluded = excludedAnchors.includes(name);
                console.log(excluded)
                chart.excludeAnchor(l.data.name, !excluded);
            }
        }

        function initChart(container) {
          customBar(selector, data);
          graphContainer = container
            .append('div')
            .attr('class', 'graph-container');
          graphContainer
                .append('div')
                .attr('class', 'phylogramContainer p-1')
          contextAndLegend = graphContainer
                .append('div')
                .attr('class', 'gcontextAndLegend')
                .style('opacity', 0);
          contextContainer = contextAndLegend
                .append('div')
                .attr('class', 'gcontext m-1');

          contextAndLegend
            .transition()
            .duration(duration)
            .delay(delay.enter*1.5)
            .style('opacity', 1);
          legendContainer = contextAndLegend
                .append('div')
                .attr('class', 'p-1 pt-0 legendContainer')
                .append('div')
                .attr('class', 'legend w-100 h-100');
          drawLegend();
          let contextSVG = contextContainer
            .insert('svg', '.legendContainer')
            .attr('class', 'gcontextSVG')
            .attr('width', width)
            .attr('height', height);
          contextG = contextSVG
                .append('g')
                .attr('transform', 'translate('
                    + margin.left
                    + ','
                    + margin.top + ')');
          if (newick) {
              buildTree(selector + ' .phylogramContainer',
                  newick, newickFields,
                  {
                      enterEach : treeLeafEnter,
                      enterMouseOver : treeLeafMouseOver,
                      enterMouseLeave : treeLeafMouseLeave,
                      enterClick : treeLeafClick,
                      exitEach : treeLeafExit,
                  });
          } else {}

          updateWidth();
          contextSVG
            .attr('width', width);
          contextG.selectAll('g.gene')
            .data(data, d => d.anchor + d.pos)
            .enter()
                .append('g')
                .attr('class', d => {
                    let cl = 'gene'
                    cl += d.pos == 0
                        ? ' anchor'
                        : '';
                    return cl
                })
                .attr('id', d => 'gene' + cleanString(d.anchor + d.pos))
                .attr('transform', d => 'translate(' +
                    (+d.pos + nSide) * geneRect.w
                    + ","
                    + getY(d)
                    + ")")
                .transition()
                .duration(duration)
                .delay(delay.enter)
                .style('opacity', 1)
                .each(enterGene)

        }

        function getArrow(d, x0, rectWidth, tipWidth) {
          var tipPath, strokePath;
          let rect = geneRect;
          if (d.strand == "-") {
            tipPath = [
              "M",
              x0,
              " ",
              "0",
              " ",
              "L",
              x0 - tipWidth,
              " ",
              (rect.h - rect.pv) / 2,
              " ",
              "L",
              x0,
              " ",
              rect.h - rect.pv,
              " ",
              "Z"
            ].join("");
            strokePath = [
              "M",
              x0,
              " ",
              "0",
              " ",
              "L",
              x0 - tipWidth,
              " ",
              (rect.h - rect.pv) / 2,
              " ",
              "L",
              x0,
              " ",
              rect.h - rect.pv,
              " ",
              "L",
              x0 + rectWidth - rect.ph,
              " ",
              rect.h - rect.pv,
              " ",
              "L",
              x0 + rectWidth - rect.ph,
              " ",
              "0",
              " ",
              "Z"
            ].join("");
          } else {
            tipPath = [
              "M",
              x0 + rectWidth - rect.ph,
              " ",
              "0",
              " ",
              "L",
              x0 + rectWidth - rect.ph + tipWidth,
              " ",
              (rect.h - rect.pv) / 2,
              " ",
              "L",
              x0 + rectWidth - rect.ph,
              " ",
              rect.h - rect.pv,
              " ",
              "Z"
            ].join("");
            strokePath = [
              "M",
              x0 + rectWidth - rect.ph,
              " ",
              "0",
              " ",
              "L",
              x0 + rectWidth - rect.ph + tipWidth,
              " ",
              (rect.h - rect.pv) / 2,
              " ",
              "L",
              x0 + rectWidth - rect.ph,
              " ",
              rect.h - rect.pv,
              " ",
              "L",
              x0,
              " ",
              rect.h - rect.pv,
              " ",
              "L",
              x0,
              " ",
              "0",
              "Z"
            ].join("");
          }
          return { tipPath: tipPath, strokePath: strokePath };
        }

        function filterByLevel(d) {
            return !notationLevel
                ? true
                : !d.level
                ? true
                : d.level == notationLevel
        }

        function filterNotation(n) {
            return excludedNotation.includes(n.id)
                ? false
                : filterByLevel(n)
        }

        updateNotation = function() {
            contextG.selectAll('g.gene')
                .each(updateGene);
        }

        updateLegend = function() {
            // Update title
            splitLegend.select('.legend-title')
                .style('opacity', 0)
                .html(notation.toUpperCase())
                .transition()
                .duration(duration)
                .style('opacity', 1);

            let nots = data.map(d =>
                !d[notation]
                ? []
                : typeof d[notation] == 'object'
                ? d[notation].filter(filterByLevel)
                : [{id:d[notation]}])
                .flat();
            let uniqueNotation = {};
            nots.forEach(n => uniqueNotation[n.id] = n);
            uniqueNotation = [...Object.values(uniqueNotation)]
            let factor = 50;
            // Scale legend to fit all data
            let legendHeight = uniqueNotation.length * factor;
            splitLegend
                .transition()
                .duration(duration)
                .delay(delay.update)
                .style("height",
                    Math.min(window.innerHeight - 50,
                             legendHeight + 100) + "px");
            let legendEntry = splitLegend
                .selectAll('.lgnd-entry')
                .data(uniqueNotation);
            let legendEntryEnter = legendEntry
                .enter()
                .append('div')
                .attr('class', 'lgnd-entry')
                .style("outline", "none")
                .style("display", "flex");
            legendEntryEnter
                .on('mouseover', (_, n) => graphContainer
                        .selectAll(`path.stroke.c${cleanString(n.id)}`)
                        .style('opacity', 1));
            legendEntryEnter
                .on('mouseleave', (_, n) => graphContainer
                        .selectAll(`path.stroke.c${cleanString(n.id)}`)
                        .style('opacity', 0));
            legendEntryEnter
                .append('svg')
                .attr("width", 40)
                .attr("height", 40)
                .style("display", "inline-block")
                .style("margin-top", "6px")
                .append("circle")
                 .attr("r", 6)
                 .attr("cx", 20)
                 .attr("cy", 6.5)
                .style("fill", n => palette(n.id));
            let checkboxDivEnter = legendEntryEnter
                .append("div")
                .style("display", "inline-block")
                .style("outline", "none");
            let checkboxLabelEnter = checkboxDivEnter
                .append('label')
                .attr('class', 'form-check m-1 ml-2');
            checkboxLabelEnter
                .append('input')
                .attr("type", "checkbox")
                .attr("checked", "")
                .attr("style", "margin-top:0 !important;")
                .on('change', (e, n) => {
                    e.target.checked
                        ? chart.excludeNotation(n.id, false)
                        : chart.excludeNotation(n.id, true)
                })
            checkboxLabelEnter
                .append('span')
                .attr("class", "form-check-label");
            checkboxDivEnter
                .append("div")
                .attr("class", "w-100 lgnd-entry-description")
                .style("display", "block")
                .style("max-height", "35px")
                .style("height", "35px");

            let legendEntryMerged = legendEntryEnter
                .merge(legendEntry)
                .attr('class', n => 'lgnd-entry '
                        + `lgnd${cleanString(n.id)}`)
            legendEntryMerged
                .select('circle')
                .transition()
                .duration(duration)
                .style("fill", n => palette(n.id));
            legendEntryMerged
                .select('input')
                .attr('class', n => 'mt-0 form-check-input rounded-pill '
                    + `form-check-legend lgnd-switch lgnd${cleanString(n.id)}`)
            legendEntryMerged
                .select('span')
                .html(n => !URLs[notation]
                    ? `<em>${n.id}</em>`
                    : '<a href="'
                        + URLs[notation].b
                        + String(n.id)
                        + URLs[notation].a
                        + '" target="_blank" style="outline:none;">'
                        + String(n.id)+'</a>');
            legendEntryMerged
                .select('.lgnd-entry-description')
                .html(n => n.description);
            legendEntry
                .exit()
                .style('opacity', 0)
                .remove();
            splitLegend
                .selectAll('div')
                .style('opacity', 0)
                .transition()
                .duration(duration)
                .delay(delay.enter)
                .style('opacity', 1);
        }

        function drawLegend() {
            // Sticky legend
            let stickyLegend = legendContainer.append('div')
                        .attr('class', 'sticky-legend sticky')
            // Legend is split to optimize space
            splitLegend = stickyLegend
                        .append('div')
                        .attr('class', 'split-legend notation-legend mt-1')
                        .style('width', '300px')
            // Legend title
            splitLegend.append('div')
                       .attr('class', 'legend-title');
            // Select-all checkbox
            addCheckbox(splitLegend.append("div")
                              .attr("class", "pl-3")
                              .style("display", "flex"),
                        "Select all",
                        "form-check-legend lgnd-toggleAll");
            // No data legend entry
            let noData = splitLegend.append("div")
                            .style("outline", "none")
                            .style("display", "flex");
            let noDataSVG = noData.append("svg")
               .attr("width", 40)
               .attr("height", 40)
               .style("display", "inline-block");
            noDataSVG
             .append('circle')
             .attr("r", 6)
             .attr("cx", 20)
             .attr("cy", 6.5)
             .style("fill", color.noData);
            noData.append("div")
               .style("display", "inline-block")
               .style("outline", "none")
               .html("No data");
            updateLegend(splitLegend);
            // Toggle checkboxes if clicked
            let legendSwitch = splitLegend.select('.lgnd-toggleAll')
            legendSwitch.on('change', () => {
                let switches = splitLegend.selectAll('.lgnd-switch');
                legendSwitch.property('checked')
                    ? switches.property('checked', true)
                    : switches.property('checked', false)
                switches.nodes().forEach(s => triggerEvent(s, 'change'))
            })
        }

        function hoverGene(d) {
            let geneD3 = contextG
                .select("#gene"
                    + cleanString(d.anchor + d.pos));
            let stroke = geneD3
                .select('path.stroke');
            let geneName = geneD3
                .select('text.geneName')
            let leaf = graphContainer
                .select('#leaf'
                + cleanString(d.anchor));
            let leafCircle = leaf
                .select('circle');
            let leafText = leaf
                .select('text');
            function mouseOver() {
                stroke
                 .style('opacity', 1);
                geneName
                 .style('fill', color.black);
                // Highlight tree
                leafCircle
                    .style('stroke', color.highlight)
                    .style('fill', color.highlight);
                leafText
                    .style('fill', color.highlight)
                let nots = d[notation];
                if (typeof nots != 'object') nots = [{id:nots}];
                nots.filter(filterByLevel).forEach(n => {
                    // Highlight legend
                    let div = graphContainer
                        .select(`.lgnd${cleanString(n.id)}`);
                    let t = div.select('a');
                    t = t.nodes().length == 0
                        ? div.select('em')
                        : t;
                    t.style('color', color.highlight);
                })
            }
            function mouseLeave() {
                stroke
                 .style('opacity', 0);
                geneName
                 .style('fill', color.white);
                // Highlight tree
                leafCircle
                    .style('stroke', leafColor.stroke)
                    .style('fill', leafColor.fill);
                leafText
                    .style('fill', color.darkGray)
                let nots = d[notation];
                if (typeof nots != 'object') nots = [{id:nots}];
                nots.filter(filterByLevel).forEach(n => {
                    // Highlight legend
                    let div = graphContainer
                        .select(`.lgnd${cleanString(n.id)}`);
                    let t = div.select('a');
                    t = t.nodes().length == 0
                        ? div.select('em')
                        : t;
                    t.style('color', color.primary);
                })
            }
            return {
                mouseOver : mouseOver,
                mouseLeave : mouseLeave
            }
        }

        function formatNotation(n) {
            let unfNots = !n || n.length == 0
                ? [{id:'NA'}]
                : typeof n == 'object'
                ? n
                : [{id:n}];
            let nots = unfNots.filter(filterNotation);
            nots = nots.length == 0
                ? [{id:'NA'}]
                : nots;
            return {
                unfNots : unfNots,
                nots : nots
            }
        }

        function parameterListener() {
            // nSide slider
            let nSideSlider = container
                .select('.nSideSlider')
                .node()
                .noUiSlider;
            nSideSlider.on('change', () => {
                chart.nSide(Math.round(nSideSlider.get()))
            })
            // Tree toggler
            let treeToggler = container
                .select('input.toggleTree');
            treeToggler.on('change', () => {
                options.showTree = treeToggler.property('checked');
                toggleTree();
            })
            // Show on gene
            let showOptions = container
                .select('select.showName')
                .node();
            container
                .select('.showName + .select-selected')
                .on('DOMSubtreeModified', () => {
                    newShowName = showOptions
                        .options[showOptions.selectedIndex]
                        .value;
                    if(newShowName != ''
                    && newShowName != showName) chart.showName(newShowName)
                })
            // Notation level
            let notationLevelOptions = container
                .select('select.notationLevel')
                .node();
            container
                .select('.notationLevel + .select-selected')
                .on('DOMSubtreeModified', () => {
                    let newNotationLevel = notationLevelOptions
                        .options[notationLevelOptions.selectedIndex]
                        .value;
                    if(newNotationLevel != notationLevel) {
                        chart.notation(notation, newNotationLevel)
                    }
                })
            // Notation options
            let notationOptions = container
                .select('select.notation')
                .node();
            container
                .select('.notation + .select-selected')
                .on('DOMSubtreeModified', () => {
                    let newNotation = notationOptions
                        .options[notationOptions.selectedIndex]
                        .value;
                    if(newNotation != ''
                    && newNotation != notation) {
                        let notationLevelOption = notationLevelOptions
                        .options[notationLevelOptions.selectedIndex]
                        .value;
                        chart.notation(newNotation, notationLevelOption)
                    }
                })
            container
                .select('.shuffleColors')
                .on('click', () => chart.shuffleColors());
            container
                .select('.downloadPng')
                .on('click', () => chart.toPng());
        }

        updateWidth = function() {
            let totalWidth = +graphContainer
                .node()
                .clientWidth;
            let treeWidth = 0;
            if (newick) treeWidth = +graphContainer
                    .select('.phylogram svg')
                    .attr('target-width');
            treeWidth = Math.min(.4*totalWidth, treeWidth);
            graphContainer
                .select('.gcontextAndLegend')
                .style('width', `calc(100% - ${treeWidth}px)`)
            width = graphContainer
                .select('.gcontext')
                .node()
                .clientWidth;
            graphContainer
                .select('.gcontextSVG')
                .attr('width', width)
            geneRect.w = (width - 7) / (2 * nSide + 1)
        }

        updateHeight = function() {
            // Avoid errors when tree is not present
            let targetHeight;
            try {
                targetHeight = graphContainer
                    .select('.phylogram svg')
                    .attr('target-height');

            } catch {
                targetHeight = d3.max(graphContainer
                .selectAll('g.gene')
                .nodes()
                .map(n => n.getBoundingClientRect().top))
                - graphContainer.node().getBoundingClientRect().top
                + geneRect.h + 10;
            }
            graphContainer
            .select('.gcontextSVG')
            .transition()
            .duration(duration)
            .delay(delay.update)
            .attr('height', targetHeight)
        }

        function enterGene(d) {
            let geneG = d3.select(this);
            let {
                unfNots,
                nots
            } = formatNotation(d[notation]);
            let nRect = +nots.length;
            let barWidth = (geneRect.w - geneRect.ph) / nRect;
            let tipWidth = (2 * geneRect.ph) / 5;
            let x0 //, xf;
            x0 = d.strand == "-" ? tipWidth : 0;
            let geneRects = geneG.selectAll('rect.gene-rect')
                                 .data(nots, n => n.id);
            geneRects
            .enter()
              .append('rect')
              .attr('class', 'gene-rect')
              .attr('fill', n => n.id == 'NA'
                ? color.noData
                : palette(n.id))
              .attr('x', (_, i) => x0 + i * barWidth)
              .attr('y', 0)
              .attr('width', barWidth)
              .attr('height', geneRect.h - geneRect.pv)
            let { tipPath, strokePath } = getArrow(d, x0, geneRect.w, tipWidth);
            geneG
            .selectAll('path.gene-tip')
            .data(d => d.strand == '-'
                            ? [nots[0]]
                            : [nots[nots.length-1]],
                  n => n.id)
            .enter()
            .append('path')
            .attr('d', tipPath)
            .attr('class', 'gene-tip')
            .attr('fill', n => n.id == 'NA'
                ? color.noData
                : palette(n.id));
            geneG
            .append('path')
            .attr('d', strokePath)
            .attr('class', 'light-stroke');
            geneG
            .append('path')
            .attr('d', strokePath)
            .attr('class', 'stroke '
                        + unfNots.filter(filterByLevel)
                        .map(n => `c${cleanString(n.id)}`)
                        .join(' '))
            .style('opacity', 0);
            geneG
            .append('text')
            .attr('class', 'geneName')
            .attr('x', geneRect.w/2 - geneRect.ph/2
                + (d.strand == '-'
                    ? tipWidth
                    : 0))
            .attr('y', geneRect.h / 1.7)
            .style('opacity', g => options.showName
                && getShowName(g) != "."
                    ? 1 : 0)
            .text(getShowName);
            // Hover rationale
            let { mouseOver, mouseLeave } = hoverGene(d);
            let popperShow = PopperCreate(selector + ' .gcontext', d, URLs);
            // Gene SVG group
            geneG.node().childNodes.forEach(c => {
                c.addEventListener('click', popperShow);
                c.addEventListener('mouseover', mouseOver);
                c.addEventListener('mouseleave', mouseLeave);
            });
        }

        function updateGene(d) {
            let geneG = d3.select(this);
            let { mouseOver, mouseLeave } = hoverGene(d);
            let popperShow = PopperCreate(selector + ' .gcontext', d, URLs);
            let {
                unfNots,
                nots
            } = formatNotation(d[notation]);
            let nRect = +nots.length > 0 ? +nots.length : 1;
            let barWidth = (geneRect.w - geneRect.ph) / nRect;
            let tipWidth = (2 * geneRect.ph) / 5;
            let x0, xf;
            x0 = d.strand == "-" ? tipWidth : 0;
            let geneRects = geneG
                .selectAll('rect.gene-rect')
                .data(nots, n => n.id);
            let geneRectsEnter = geneRects
            .enter()
              .insert('rect', 'path')
              .attr('class', 'gene-rect')
              .attr('fill', n => n.id == 'NA'
                ? color.noData
                : palette(n.id))
              .attr('x', (_, i) => x0 + i * barWidth)
              .attr('y', 0)
              .attr('width', 0)
              .attr('height', geneRect.h - geneRect.pv)
              .style('opacity', 0)
            geneRectsEnter
              .on('mouseover', () => mouseOver())
              .on('mouseleave', () => mouseLeave())
              .on('click', () => popperShow())
            // Updating gene rects
            let mergedGeneRects = geneRectsEnter
            .merge(geneRects);
            mergedGeneRects
              .transition()
              .duration(duration)
              .delay(delay.update)
              .attr('x', (_, i) => x0 + i * barWidth)
              .attr('width', barWidth);
            mergedGeneRects
              .transition()
              .duration(duration)
              .delay(delay.enter)
              .attr('fill', n => n.id == 'NA'
                ? color.noData
                : palette(n.id))
              .style('opacity', 1);
            geneRects
            .exit()
            .transition()
            .duration(duration)
            .style('opacity', 0)
            .remove();

            let { tipPath, strokePath } = getArrow(d, x0, geneRect.w, tipWidth);
            let geneTip = geneG
            .selectAll('path.gene-tip')
            .data(d => d.strand == '-'
                            ? [nots[0]]
                            : [nots[nots.length-1]],
                  n => n.id);
            let geneTipEnter = geneTip
            .enter()
            .insert('path', 'path.light-stroke')
            .attr('class', 'gene-tip');
            geneTipEnter
            .attr('fill', n => n.id == 'NA'
                          ? color.noData
                          : palette(n.id))
            .style('opacity', 0);
            let geneTipMerged = geneTipEnter
            .merge(geneTip);
            geneTipMerged
            .transition()
            .duration(duration)
            .delay(delay.update)
            .attr('d', tipPath);
            geneTipMerged
            .transition()
            .duration(duration)
            .delay(delay.enter)
            .attr('fill', n => n.id == 'NA'
                          ? color.noData
                          : palette(n.id))
            .style('opacity', 1);
            geneTip
            .exit()
            .transition()
            .duration(duration)
            .style('opacity', 0)
            .remove();
            geneG
            .select('path.light-stroke')
            .transition()
            .duration(duration)
            .delay(delay.update)
            .attr('d', strokePath)
            geneG
            .select('path.stroke')
            .attr('d', strokePath)
            .attr('class', 'stroke '
                        + unfNots.filter(filterByLevel)
                        .map(n => `c${cleanString(n.id)}`)
                        .join(' '))
            .transition()
            .duration(duration)
            .delay(delay.update)
            .style('opacity', 0);
            geneG
            .select('text.geneName')
            .attr('y', geneRect.h / 1.7)
            .transition()
            .duration(duration)
            .delay(delay.update)
            .attr('x', geneRect.w/2 - geneRect.ph/2
                + (d.strand == '-'
                    ? tipWidth
                    : 0))
            .style('opacity', g => options.showName
                && getShowName(g) != "."
                    ? 1 : 0)
            .text(getShowName);
        }

        enterGenes = function() {
            let genes = contextG
                .selectAll('g.gene')
                .data(data, d => d.anchor + d.pos);
            genes
            .transition()
            .duration(duration)
            .delay(delay.update)
            .attr('transform', d =>
                'translate(' +
                (+d.pos + nSide) * geneRect.w +
                "," +
                getY(d) +
                ")")
            genes
            .transition()
            .duration(duration)
            .delay(delay.enter)
            .style('opacity', 1);

            genes.enter()
            .append('g')
            .attr('class', d => {
                let cl = 'gene'
                cl += d.pos == 0
                    ? ' anchor'
                    : '';
                return cl
            })
            .attr('id', d => 'gene' + cleanString(d.anchor + d.pos))
            .attr('transform', d =>
                'translate(' +
                (+d.pos + nSide) * geneRect.w +
                "," +
                getY(d) +
                ")")
            .style('opacity', 0)
            .each(enterGene)
            .transition()
            .duration(duration)
            .delay(delay.enter)
            .style('opacity', 1)

            updateHeight();
        }

        exitGenes = function() {
            let genes = contextG.selectAll('g.gene')
                .data(data, d => d.anchor + d.pos);

            genes
            .transition()
            .duration(duration)
            .delay(delay.update)
            .attr('transform', d =>
                'translate(' +
                (+d.pos + nSide) * geneRect.w +
                "," +
                getY(d) +
                ")")
            genes
            .exit()
            .transition()
            .duration(duration)
            .delay(delay.exit)
            .style('opacity', 0)
            .remove();

            updateHeight();
        }

        updateGenes = function() {
            // Update data-dependant variables
            var update = contextG.selectAll('g.gene')
                .data(data, d => d.anchor + d.pos);

            update.enter()
            .append('g')
            .attr('class', d => {
                let cl = 'gene'
                cl += d.pos == 0
                    ? ' anchor'
                    : '';
                return cl
            })
            .attr('id', d => 'gene' + cleanString(d.anchor + d.pos))
            .attr('transform', d =>
                'translate(' +
                (+d.pos + nSide) * geneRect.w +
                "," +
                getY(d) +
                ")")
            .style('opacity', 0)
            .each(enterGene)
            .transition()
            .duration(duration)
            .delay(delay.enter)
            .style('opacity', 1)

            update
            .merge(update)
            .transition()
            .duration(duration)
            .delay(delay.update)
            .attr('transform', d =>
                'translate(' +
                (+d.pos + nSide) * geneRect.w +
                "," +
                getY(d) +
                ")")
            .style('opacity', 1)
            .each(updateGene);

            update.exit()
            .transition()
            .duration(duration)
            .delay(delay.exit)
            .style('opacity', 0)
            .remove();
        }

        var container = d3.select(this);
        var legendContainer,
            splitLegend,
            graphContainer,
            contextAndLegend,
            contextContainer,
            contextG
        initChart(container);
        parameterListener();
        updateHeight();
    });
  }

  function buildDomain() {
      domain = data.map(d => {
          let not = d[notation];
          return !not
            ? []
            : typeof not == 'object'
            ? not.map(n => n.id)
            : [not]
      }).flat();
      domain = [...new Set(domain)]
  }

  function updatePalette(shuffle=false) {
        buildDomain();
        palette = buildPalette(domain, shuffle);
  }

  function filterAnchor(a) {
      return !excludedAnchors.includes(a)
            ? true
            : false
  }

  function updateData() {
      data = unfData.filter(d => Math.abs(+d.pos) <= nSide
                        && filterAnchor(d.anchor))
      anchors = [...new Set(data.map(d => d.anchor))];
  }

  function swapStrands(unswapped) {
        let anchorToSwap = unswapped.map(d => {
            if (d.pos == 0 && d.strand == '-') return d.anchor
        })
        let swapped = []
        unswapped.forEach(d => {
            let dCopy = Object.assign({}, d)
            if (anchorToSwap.includes(d.anchor)) {
                dCopy.pos = (-1) * (+d.pos);
                dCopy.strand = d.strand == '+'
                    ? '-'
                    : '+';
            }
            swapped.push(dCopy);
        })
        return swapped;
  }

  chart.data = function(d) {
    if (!arguments.length) return data;
    unfData = swapStrands(d);
    updateData();
    if (typeof updatePalette === 'function') updatePalette();
    if (typeof updateGenes === 'function') updateGenes();
    if (typeof updateGenes === 'function') updateGenes();
    return chart;
  };

  chart.tree = function(n, fields = ['name']) {
        if (!arguments.length) return newick;
        if (n) newick = parseNewick(n, fields);
        newickFields = fields;
        return chart;
  }

  chart.nSide = function(d) {
    if (!arguments.length) return nSide;
    nSide = d;
    updateData()
    if (typeof updateWidth === 'function') updateWidth();
    if (typeof updateLegend === 'function') updateLegend();
    if (typeof updateGenes === 'function') updateGenes();
    return chart;
  };

  chart.notation = function(not, level = undefined) {
    if (!arguments.length) return notation;
    notation = not;
    notationLevel = level;
    if (typeof updatePalette === 'function') updatePalette();
    if (typeof updateLegend === 'function') updateLegend();
    if (typeof updateNotation == 'function') updateNotation();
    return chart;
  };

  chart.excludeNotation = function(notationID, exclude=true) {
    if (!arguments.length) return excludedNotation;
    if (exclude && !excludedNotation.includes(notationID))
      { excludedNotation.push(notationID) }
    else if (!exclude && excludedNotation.includes(notationID))
      { excludedNotation = excludedNotation.filter(n => n != notationID) }
    if (typeof updateNotation == 'function') updateNotation();
    return chart;
  }

  chart.excludeAnchor = function(anchor, exclude=true) {
    if (!arguments.length) return excludedAnchors;
    if (exclude && !excludedAnchors.includes(anchor))
      {
        excludedAnchors.push(anchor)
        if (typeof updateData == 'function') updateData();
        if (typeof exitGenes == 'function') exitGenes();
      }
    else if (!exclude && excludedAnchors.includes(anchor))
      {
        excludedAnchors = excludedAnchors.filter(a => a!= anchor)
        if (typeof updateData == 'function') updateData();
        if (typeof enterGenes == 'function') enterGenes();
      }
    return chart;
  }

  chart.showName = function(field) {
    if (!arguments.length) return showName;
    showName = field;
    if (typeof updateShowName == 'function') updateShowName();
    return chart;
  }

  chart.shuffleColors = function() {
    if (typeof updatePalette === 'function') updatePalette(true);
    if (typeof updateLegend === 'function') updateLegend();
    if (typeof updateNotation == 'function') updateNotation();
  }

  chart.toPng = function() {
      let toDownload = document.querySelector(selector + ' .graph-container');
      let dimensions = toDownload.getBoundingClientRect();
      let legendHeight = d3.select(selector)
          .select('.split-legend')
          .node()
          .getBoundingClientRect()
          .height + 7;
      let scrollX = $(document).scrollLeft();
      let scrollY = $(document).scrollTop();
      //['.phylogram',
      //'.gcontext',
       //'.split-legend'].forEach(d => {
           //d3.select(selector)
            //.select(d)
            //.style('border-color', 'transparent');
      //})
      let splitLegend = d3.select(selector).select('.split-legend');
      let legendEntries = splitLegend.selectAll('.lgnd-entry')
      splitLegend.select('.pl-3').style('display', 'none')
      legendEntries.select('label').style('padding-left', '.5rem')
      legendEntries.select('input').style('display', 'none')
      html2canvas(toDownload, {
          width : dimensions.width,
          height : Math.max(dimensions.height, legendHeight),
          scrollX : - scrollX,
          scrollY : - scrollY,
      })
        .then(canvas => {
            canvas.toBlob(blob => saveAs(blob, 'GeCoViz.png'))
            splitLegend.select('.pl-3').style('display', 'block')
            legendEntries.select('label').style('padding-left', '1.5rem')
            legendEntries.select('input').style('display', 'block')
            //['.phylogram',
             //'.gcontext',
             //'.split-legend'].forEach(d => {
               //d3.select(selector)
                //.select(d)
                //.style('border-color', 'var(--dark-gray)');
            //})
        });
  }

  PopperClick(selector + ' .gcontext');
  return chart;
}
