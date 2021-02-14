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
  var showName = "showName";
  var notation = "kegg";
  var notationLevel;
  var excludedNotation = [];
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
  var updateData,
        updateShowName,
        updateNotation,
        updatePalette,
        drawLegend,
        updateWidth;
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
      darkGray : 'var(--dark-gray)',
      sand : 'var(--sand)',
      darkPurple : 'var(--dark-purple)',
      purple : 'var(--purple)',
  }
  var leafColor = {
      stroke : color.darkPurple,
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
                            + cleanString(d.anchor))
                        .node()
                        .getBoundingClientRect()
                        .top
                    - d3.select(selector + ' .phylogram')
                        .node()
                        .getBoundingClientRect()
                        .top;
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

        function initChart(container) {
          customBar(selector);
          graphContainer = container
            .append('div')
            .attr('class', 'row graph-container');
          if (newick) {
                buildTree(selector + ' .graph-container',
                  newick, newickFields)
            }
          let contextContainer = graphContainer
                .append('div')
                .attr('class', 'col-md-6 p-1')
                .append('div')
                .attr('class', 'gcontext')
                .style('opacity', 0);

          contextContainer
            .transition()
            .duration(duration)
            .delay(delay.enter)
            .style('opacity', 1);

          updateWidth = function() {
              width = contextContainer.node()
                .getBoundingClientRect()
                .width - 5;
              geneRect.w = width / (2 * nSide + 1)
          }
          updateWidth();
          legendContainer = graphContainer
                .append('div')
                .attr('class', 'col-md-2 p-1')
                .append('div')
                .attr('class', 'legend w-100');
          drawLegend();
          let contextSVG = contextContainer
            .append('svg')
            .attr('class', 'gcontextSVG')
            .attr('width', width)
            .attr('height', height);
          contextG = contextSVG
                .append('g')
                .attr('transform', 'translate('
                    + margin.left
                    + ','
                    + margin.top + ')');
          contextG.selectAll('g.gene')
            .data(data, d => d.anchor + d.pos)
            .enter()
                .append('g')
                .attr('class', 'gene')
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
                .each(enterGene);
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
                .each(updateGene)
                .each(updateGene);
        }

        drawLegend = function() {
            // Empty pre-existing legend
            legendContainer
                .selectAll('*')
                .transition()
                .duration(duration)
                .style('opacity', 0)
                .remove();
            legendContainer
                .style('opacity', 0)
                .transition()
                .duration(duration)
                .delay(delay.enter)
                .style('opacity', 1);
            let factor = 40;
            // Sticky legend
            let stickyLegend = legendContainer.append('div')
                        .attr('class', 'sticky-legend sticky')
            // Legend is split to optimize space
            let splitLegend = stickyLegend
                        .append('div')
                        .attr('class', 'split-legend notation-legend');
            // Legend title
            splitLegend.append('div')
                       .attr('class', 'legend-title')
                       .html(notation.toUpperCase());
            let nots = data.map(d =>
                !d[notation]
                ? []
                : typeof d[notation] == 'object'
                ? d[notation].filter(filterByLevel)
                : [{id:d[notation]}])
                .flat();
            console.log(nots)
            let uniqueNotation = {};
            nots.forEach(n => uniqueNotation[n.id] = n);
            uniqueNotation = [...Object.values(uniqueNotation)]
            console.log(uniqueNotation)
            // Scale legend to fit all data
            let legendHeight = uniqueNotation.length * factor;
            splitLegend
                .style("height",
                    Math.min(window.innerHeight - 50,
                             legendHeight + 100) + "px");
            // Select-all checkbox
            addCheckbox(splitLegend.append("div")
                              .attr("class", "pl-3")
                              .style("display", "flex"),
                        "Select all",
                        "lgnd-toggleAll");
            // Toggle checkboxes if clicked
            let legendSwitch = $(selector + " .lgnd-toggleAll");
            legendSwitch = [...legendSwitch]
            legendSwitch = legendSwitch[legendSwitch.length - 1]
            legendSwitch.addEventListener('change', () => {
                let switches = $(selector + " .lgnd-switch");
                if (legendSwitch.checked) {
                    switches.prop("checked", true);
                } else {
                    switches.prop("checked", false);
                }
                switches.trigger("change");
            })
            // No data legend entry
            let noData = splitLegend.append("div")
                            .style("outline", "none")
                            .style("display", "flex");
            let noDataSVG = noData.append("svg")
               .attr("width", 40)
               .attr("height", 40)
               .style("display", "inline-block");
            noDataSVG
             .append("circle")
             .attr("r", 6)
             .attr("cx", 20)
             .attr("cy", 6.5)
             .style("fill", color.noData);
            noData.append("div")
               .style("display", "inline-block")
               .style("outline", "none")
               .html("No data");
            uniqueNotation.forEach(n => {
                let div = splitLegend.append("div")
                                .attr('class', 'lgnd' + cleanString(n.id))
                                .style("outline", "none")
                                .style("display", "flex");
                div.append("svg")
                   .attr("width", 40)
                   .attr("height", 40)
                   .style("display", "inline-block")
                   .style("margin-top", "6px")
                   .append("circle")
                     .attr("r", 6)
                     .attr("cx", 20)
                     .attr("cy", 6.5)
                     .style("fill", palette(n.id));
                let t = div.append("div")
                         .style("display", "inline-block")
                         .style("outline", "none");
                let title = !URLs[notation]
                        ? "<em>" + n.id + "</em>"
                        : '<a href="'
                            + URLs[notation].b
                            + n.id
                            + URLs[notation].a
                            + '" target="_blank" style="outline:none;">'
                            + n.id+'</a>';
                addCheckbox(t, title, "lgnd-switch lgnd" + cleanString(n.id));
                let cbox = $(selector
                    + " .lgnd" + cleanString(n.id)
                    + " .lgnd-switch");
                cbox.change(() => {
                    if (cbox.is(":checked")) {
                        chart.excludeNotation(n.id, false);
                    } else {
                        chart.excludeNotation(n.id, true);
                    }
                })
                t.append("div")
                  .attr("class", "w-100")
                  .style("display", "block")
                  .style("max-height", "35px")
                  .html(n.description);
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
                        .select(".lgnd"
                        + cleanString(n.id))
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
                 .style('fill', color.sand);
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
                    let div = d3.select(selector
                        + " .lgnd"
                        + cleanString(n.id))
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
                : [n];
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
                    if(newShowName != showName) chart.showName(newShowName)
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
                    if(newNotation != notation) {
                        let notationLevelOption = notationLevelOptions
                        .options[notationLevelOptions.selectedIndex]
                        .value;
                        chart.notation(newNotation, notationLevelOption)
                    }
                })
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
            let x0, xf;
            x0 = d.strand == "-" ? tipWidth : 0;
            let geneRects = geneG.selectAll('rect.gene-rect')
                                 .data(nots, n => n.id);
            geneRects
            .enter()
              .append('rect')
              .attr('class', n => 'gene-rect ' + cleanString(n.id))
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
                            .map(n => 'c' + cleanString(n.id))
                            .join(' '))
            .style('opacity', 0);
            let geneName = d.name;
            if(["", "NA", undefined].every(i => i != geneName)){
                let size = +Math.floor(geneRect.w / 13.5);
                let name = d.name;
                if (size < name.length){
                    name = name.slice(0, size);
                }
                geneName = name;
            } else { geneName = " " }
            geneG
            .append('text')
            .attr('class', 'geneName')
            .attr('x', geneRect.w/2 - geneRect.ph/2)
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
            geneRects
            .enter()
              .insert('rect', 'path')
              .attr('class', n => 'gene-rect ' + cleanString(n.id))
              .attr('fill', n => n.id == 'NA'
                ? color.noData
                : palette(n.id))
              .attr('x', (_, i) => x0 + i * barWidth)
              .attr('y', 0)
              .attr('width', 0)
              .attr('height', geneRect.h - geneRect.pv)
              .style('opacity', 0)
              .each((_d, _i, rects) => {
                  let newRects = [...new Set(rects)].filter(n => n != undefined);
                  newRects.forEach(r => {
                      r.addEventListener('click', popperShow)
                      r.addEventListener('mouseover', mouseOver);
                      r.addEventListener('mouseleave', mouseLeave);
                  })
              })
            // Updating gene rects
            let mergedGeneRects = geneRects
            .merge(geneRects);
            mergedGeneRects
              .transition()
              .duration(duration)
              .delay(delay.update)
              .attr('x', (_, i) => x0 + i * barWidth)
              .attr('width', barWidth)
            mergedGeneRects
              .transition()
              .duration(duration)
              .delay(delay.enter)
              .style('opacity', 1);
            geneRects
            .exit()
            .transition()
            .duration(duration)
            .style('opacity', 0)
            .remove();

            let { tipPath, strokePath } = getArrow(d, x0, geneRect.w, tipWidth);
            let strokeClass = "stroke "
                + unfNots.map(n => "c" + cleanString(n.id)).join(" ");
            let geneTip = geneG
            .selectAll('path.gene-tip')
            .data(d => d.strand == '-'
                            ? [nots[0]]
                            : [nots[nots.length-1]],
                  n => n.id);
            let enterGeneTip = geneTip
            .enter()
            .insert('path', 'path.light-stroke')
            .attr('class', 'gene-tip');
            enterGeneTip
            .attr('fill', n => n.id == 'NA'
                          ? color.noData
                          : palette(n.id))
            .style('opacity', 0);
            let mergedGeneTip = geneTip
            .merge(geneTip);
            mergedGeneTip
            .transition()
            .duration(duration)
            .delay(delay.update)
            .attr('d', tipPath);
            mergedGeneTip
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
            .transition()
            .duration(duration)
            .delay(delay.update)
            .attr('d', strokePath)
            .attr('class', strokeClass)
            .style('opacity', 0);
            geneG
            .select('text.geneName')
            .attr('y', geneRect.h / 1.7)
            .transition()
            .duration(duration)
            .delay(delay.update)
            .attr('x', geneRect.w/2 - geneRect.ph/2)
            .style('opacity', g => options.showName
                && getShowName(g) != "."
                    ? 1 : 0)
            .text(getShowName);
        }

        updateData = function() {
            // Update data-dependant variables
            preUpdate();
            var update = contextG.selectAll('g.gene')
                .data(data, d => d.anchor + d.pos);

            update.enter()
            .append('g')
            .attr('class', 'gene')
            .attr('id', d => 'gene' + cleanString(d.anchor + d.pos))
            .attr('transform', d =>
                'translate(' +
                (+d.pos + nSide) * geneRect.w +
                "," +
                getY(d) +
                ")")
            .style('opacity', 0)
            .transition()
            .duration(duration)
            .delay(delay.enter)
            .style('opacity', 1)
            .each(enterGene);

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
            .each(updateGene)
            .each(updateGene);

            update.exit()
            .transition()
            .duration(duration)
            .delay(delay.exit)
            .style('opacity', 0)
            .remove();
        }

        updatePalette = function() {
            data = unfData.filter(d => Math.abs(+d.pos) <= nSide);
            buildDomain();
            palette = buildPalette(domain);
        }

        var container = d3.select(this);
        var legendContainer,
            graphContainer,
            contextG
        initChart(container);
        parameterListener();
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

  function preUpdate(palette=false) {
      data = unfData.filter(d => Math.abs(+d.pos) <= nSide)
      anchors = [...new Set(data.map(d => d.anchor))];
      if (palette) {
          buildDomain();
          palette = buildPalette(domain)
      }
  }

  chart.data = function(d) {
    if (!arguments.length) return data;
    unfData = d;
    preUpdate(true);
    if (typeof updatePalette === 'function') updatePalette();
    if (typeof updateData === 'function') updateData();
    return chart;
  };

  chart.tree = function(n, fields = ['name']) {
        if (!arguments.length) return newick;
        newick = parseNewick(n, fields);
        newickFields = fields;
        return chart;
  }

  chart.nSide = function(d) {
    if (!arguments.length) return nSide;
    nSide = d;
    if (typeof updateWidth === 'function') updateWidth();
    if (typeof updateData === 'function') updateData();
    return chart;
  };

  chart.notation = function(not, level = undefined) {
    if (!arguments.length) return notation;
    notation = not;
    notationLevel = level;
    preUpdate(true);
    if (typeof updatePalette === 'function') updatePalette();
    if (typeof drawLegend === 'function') drawLegend();
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

  chart.showName = function(field) {
    if (!arguments.length) return showName;
    showName = field;
    if (typeof updateShowName == 'function') updateShowName();
    return chart;
  }

  PopperClick(selector + ' .gcontext');
  return chart;
}
