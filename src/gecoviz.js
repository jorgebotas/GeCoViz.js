// import css
//import "../static/assets/tabler/css/tabler.min.css"
//import "../static/assets/tabler/css/tabler-vendors.min.css"

import "../static/css/gecoviz.css"
import "../static/css/colors.css"
import "../static/css/customBar.css"
import "../static/css/popper.css"
import "../static/css/scrollbar.css"

// Async functions support
import "core-js/stable";
import "regenerator-runtime/runtime";
import {
    extent,
    min,
    max,
    scaleLinear,
    select,
    selectAll,
} from 'd3';
import $ from 'jquery';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import Heatmap from '@jbotas/d3-heatmap';
import CustomBar from './customBar';
import {
    addCheckbox,
    cleanString,
    counter,
    triggerEvent,
} from './helpers';
import parseNewick from './newick';
import Palette from './palette';
import {
    PopperCreate,
    PopperClick,
} from './popper';
import buildTree from './tree';
import Sorter from './sorter.js'

function GeCoViz(selector) {
    var graph = function() { return this };
    var container = select(selector);
    var initialized = false;
    var unfData = [];
    var data = [];
    var heatmap;
    var newick;
    var newickFields;
    var anchors = [];
    var swappedAnchors = [];
    var nSide = 2;
    var width = 700;
    var height = 700;
    var margin = {
      top : 10,
      left : 10,
    }
    var geneText = "";
    var annotation = "";
    var annotationLevel;
    var excludedAnnotation = [];
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
      //taxonomy : {
          //b : 'https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?mode=Info&id=',
          //a : '&&lvl=3&lin=f&keep=1&srchmode=1&unlock'
      //}
      taxonomy : {
          b : 'https://gtdb.ecogenomic.org/searches?s=al&q=',
          a : ''
      }
    }
    var duration = 500;
    var delay = {
      enter : duration * 2,
      update : duration,
      exit: 0,
    }
    var geneRect = { w: width / (2 * nSide + 1), h: 16, ph: 20, pv: 5 };
    var tipWidth = (2 * geneRect.ph) / 5;
    var domain = [];
    var palette = new Palette();
    var customBar;
    var options = {
      geneText : true,
      showTree : true,
      showLegend : true,
      scaleDist : false,
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
    // Containers
    var graphContainer;
    var legendContainer;
    var splitLegend;
    var contextAndLegend;
    var contextContainer;
    var contextG;

    // Data formatters
    function filterAnchor(a) {
      return !excludedAnchors.includes(a)
            ? true
            : false
    }

    function computeCoordinates() {
      function buildScale() {
          let sizeRange = extent(data.map(d => {
              let size = Math.abs((+d.end)-(+d.start))
              return size > 0 ? size : undefined
          }));
          // TipWidth + a small rect is the minimum width
          let scaleRange = [tipWidth + 10, undefined];
          let initialScale = scaleLinear()
                        .domain([0, sizeRange[0]])
                        .range([0, scaleRange[0]]);
          scaleRange[1] = initialScale(sizeRange[1]);
          let distScale = (d) => {
              let scale = scaleLinear()
                            .domain(sizeRange)
                            .range(scaleRange);
              let sign = +d / Math.abs(+d)
              return +(sign * +scale(Math.abs(+d)));
          }
          let sizeScale = (s) => distScale(s) - tipWidth + geneRect.ph;
          return [distScale, sizeScale]
      }
      function getDist(d, neigh, swapped, pos) {
          let dist;
          if (!swapped) dist = pos > 0
              ? (+d.start) - (+neigh.end)
              : (+neigh.start) - (+d.end);
          else dist = pos > 0
              ? (+neigh.start) - (+d.end)
              : (+d.start) - (+neigh.end);
          return dist;
      }
      let [distScale, sizeScale] = buildScale();
      // Data should be sorted to compute virtual start and end
      data = Sorter.sort(data,
          (a, b) =>  Math.abs(parseInt(b.pos)) < Math.abs(parseInt(a.pos)));
      data.sort((a, b) =>  b.anchor < a.anchor);
      data.forEach(d => {
          let swapped = swappedAnchors.includes(d.anchor);
          if (+d.start && +d.end) {
              let anchoredData = data.filter(el => el.anchor == d.anchor);
              d.size = +Math.abs((+d.end) - (+d.start))
              d.vSize = sizeScale(d.size)
              if (+d.pos == 0) {
                  d.vStart = (width - 7) / 2;
                  d.vEnd = (+d.vStart) + distScale(d.size);
              } else {
                  if (+d.pos > 0) {
                      let neigh = anchoredData.find(n => +n.pos == +d.pos - 1);
                      let dist = distScale(getDist(d, neigh, swapped, 1)) || 0;
                      d.vStart = (+neigh.vEnd) + dist;
                      d.vEnd = d.vStart + distScale(d.size);
                  }
                  else if (+d.pos < 0) {
                      let neigh = anchoredData.find(n => +n.pos == +d.pos + 1);
                      let dist = distScale(getDist(d, neigh, swapped, -1)) || 0;
                      d.vEnd = (+neigh.vStart) - dist;
                      d.vStart = d.vEnd - distScale(d.size);
                  }
              }
          } else {
              d.vSize = geneRect.w;
              d.vStart = undefined;
              d.vEnd = undefined;
          }
      })
    }

    function updateData() {
      data = unfData.filter(d => Math.abs(+d.pos) <= nSide
                        && filterAnchor(d.anchor))
      anchors = data.filter(d => d.pos == 0);
      if (options.scaleDist) computeCoordinates();
    }

    function swapStrands(unswapped) {
        swappedAnchors = unswapped.map(d => {
            if (d.pos == 0 && d.strand == '-') return d.anchor
        })
        let swapped = []
        unswapped.forEach(d => {
            let dCopy = Object.assign({}, d)
            if (swappedAnchors.includes(d.anchor)) {
                dCopy.pos = (-1) * (+d.pos);
                dCopy.strand = d.strand == '+'
                    ? '-'
                    : '+';
            }
            swapped.push(dCopy);
        })
        return swapped;
    }

    // Coordinate getters
    function getX(d) {
        if (options.scaleDist) return +d.vStart;
        else return (+d.pos + nSide) * geneRect.w
    }

    function getY(d) {
        let y;
        try {
            y = select(selector
                        + ' #leaf'
                        + cleanString(d.anchor)).node().__data__.x;
            return y - 11.2;
        } catch {}
        return anchors.findIndex(a => a.anchor == d.anchor) * geneRect.h;
    }

    // Tip and arrow strokes
    function getArrow(d, x0, rectWidth, tipWidth) {
      let tipPath, strokePath;
      let rect = geneRect;
      if (d.strand == "-") {
        tipPath = [
          "M",
          x0+.5,
          " ",
          "0",
          " ",
          "L",
          x0 - tipWidth,
          " ",
          (rect.h - rect.pv) / 2,
          " ",
          "L",
          x0+.5,
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

    // Gene text methods
    function getShowName(d) {
        let geneName = d[geneText];
        if(["", "NA", undefined].every(i => i != geneName)){
            let size = +Math.floor(d.geneWidth / 13.5);
            let name = d[geneText];
            if (size < name.length){
                name = name.slice(0, size);
            }
            geneName = name;
        } else { geneName = "." }
        return geneName;
    }

    function updateGeneText() {
        selectAll('text.geneName')
            .transition()
            .duration(duration)
            .style('opacity', 0)
            .transition()
            .duration(duration)
            .style('opacity', g => options.geneText
                && getShowName(g) != "."
                    ? 1 : 0)
            .text(g => getShowName(g));
    }

    // Annotation methods
    function filterByLevel(d) {
        return !annotationLevel
            ? true
            : !d.level
            ? true
            : d.level == annotationLevel
    }

    function filterAnnotation(n) {
        return excludedAnnotation.includes(n.id)
            ? false
            : filterByLevel(n)
    }

    function formatAnnotation(n) {
        let unfAnnots = !n || n.length == 0
            ? [{id:'NA'}]
            : typeof n == 'object'
            ? n
            : [{id:n}];
        let annots = unfAnnots.filter(n => filterAnnotation(n));
        annots = annots.length == 0
            ? [{id:'NA'}]
            : annots;
        return {
            unfAnnots : unfAnnots,
            annots : annots
        }
    }

    function updateAnnotation() {
        contextG.selectAll('g.gene')
            .each(g => updateGene(g));
    }

    // Gene listeners
    function hoverGene(d) {
        let geneG = contextG
            .select("#gene"
                + cleanString(d.anchor + d.pos));
        let stroke = geneG
            .select('path.stroke');
        let geneName = geneG
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
            let annots = d[annotation];
            if (typeof annots != 'object') annots = [{id:annots}];
            annots.filter(filterByLevel).forEach(n => {
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
            let annots = d[annotation];
            if (typeof annots != 'object') annots = [{id:annots}];
            annots.filter(filterByLevel).forEach(n => {
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

    // Gene methods
    function enterGene(d) {
        let geneG = contextG
            .select(`#gene${cleanString(d.anchor)}${d.pos}`);
        let {
            unfAnnots,
            annots
        } = formatAnnotation(d[annotation]);
        let nRect = +annots.length > 0 ? +annots.length : 1;
        let geneWidth;
        if (options.scaleDist) geneWidth = d.vSize;
        else geneWidth = geneRect.w;
        d.geneWidth = geneWidth;
        let barWidth = (geneWidth - geneRect.ph )/ nRect;
        let x0 //, xf;
        x0 = d.strand == "-" ? tipWidth : 0;
        let geneRects = geneG.selectAll('rect.gene-rect')
                             .data(annots, n => n.id);
        geneRects
        .enter()
          .append('rect')
          .attr('class', 'gene-rect')
          .attr('fill', n => n.id == 'NA'
            ? color.noData
            : palette.get(n.id))
          .attr('x', (_, i) => x0 + i * barWidth)
          .attr('y', 0)
          .attr('width', barWidth+.5)
          .attr('height', geneRect.h - geneRect.pv)
        let { tipPath, strokePath } = getArrow(d, x0, geneWidth, tipWidth);
        geneG
        .selectAll('path.gene-tip')
        .data(d => d.strand == '-'
                        ? [annots[0]]
                        : [annots[annots.length-1]],
              n => n.id)
        .enter()
        .append('path')
        .attr('d', tipPath)
        .attr('class', 'gene-tip')
        .attr('fill', n => n.id == 'NA'
            ? color.noData
            : palette.get(n.id));
        geneG
        .append('path')
        .attr('d', strokePath)
        .attr('class', 'light-stroke');
        geneG
        .append('path')
        .attr('d', strokePath)
        .attr('class', 'stroke '
                    + unfAnnots.filter(n => filterByLevel(n))
                    .map(n => `c${cleanString(n.id)}`)
                    .join(' '))
        .style('opacity', 0);
        geneG
        .append('text')
        .attr('class', 'geneName')
        .attr('x', geneWidth/2 - geneRect.ph/2
            + (d.strand == '-'
                ? tipWidth
                : 0))
        .attr('y', geneRect.h / 1.8)
        .style('opacity', g => options.geneText
            && getShowName(g) != "."
                ? 1 : 0)
        .text(g => getShowName(g));
        // Hover rationale
        let { mouseOver, mouseLeave } = hoverGene(d);
        let popperShow = PopperCreate(selector + ' .gcontext', d, URLs);
        // Gene SVG group
        geneG.node().childNodes.forEach(child => {
            child.addEventListener('click', popperShow);
            child.addEventListener('mouseover', mouseOver);
            child.addEventListener('mouseleave', mouseLeave);
        });
    }

    function updateGene(d) {
        let geneG = contextG
            .select(`#gene${cleanString(d.anchor)}${d.pos}`);
        let popperShow = PopperCreate(selector + ' .gcontext', d, URLs);
        let {
            unfAnnots,
            annots
        } = formatAnnotation(d[annotation]);
        let nRect = +annots.length > 0 ? +annots.length : 1;
        let geneWidth;
        if (options.scaleDist) geneWidth = d.vSize;
        else geneWidth = geneRect.w;
        d.geneWidth = geneWidth;
        let barWidth = (geneWidth - geneRect.ph )/ nRect;
        let x0 //, xf;
        x0 = d.strand == "-" ? tipWidth : 0;
        let geneRects = geneG
            .selectAll('rect.gene-rect')
            .data(annots, n => n.id);
        let geneRectsEnter = geneRects
        .enter()
          .insert('rect', 'path')
          .attr('class', 'gene-rect')
          .attr('fill', n => n.id == 'NA'
            ? color.noData
            : palette.get(n.id))
          .attr('x', (_, i) => x0 + i * barWidth)
          .attr('y', 0)
          .attr('width', 0)
          .attr('height', geneRect.h - geneRect.pv)
          .style('opacity', 0)
        let { mouseOver, mouseLeave } = hoverGene(d);
        geneRectsEnter
          .on('mouseover', mouseOver)
          .on('mouseleave', mouseLeave)
          .on('click', () => popperShow())
        // Updating gene rects
        let mergedGeneRects = geneRectsEnter
        .merge(geneRects);
        mergedGeneRects
          .transition()
          .duration(duration)
          .delay(delay.update)
          .attr('x', (_, i) => x0 + i * barWidth)
          .attr('width', barWidth+.5);
        mergedGeneRects
          .transition()
          .duration(duration)
          .delay(delay.enter)
          .attr('fill', n => n.id == 'NA'
            ? color.noData
            : palette.get(n.id))
          .style('opacity', 1);
        geneRects
        .exit()
        .transition()
        .duration(duration)
        .style('opacity', 0)
        .remove();

        let { tipPath, strokePath } = getArrow(d, x0, geneWidth, tipWidth);
        let geneTip = geneG
        .selectAll('path.gene-tip')
        .data(d => d.strand == '-'
                        ? [annots[0]]
                        : [annots[annots.length-1]],
              n => n.id);
        let geneTipEnter = geneTip
        .enter()
        .insert('path', 'path.light-stroke')
        .attr('class', 'gene-tip');
        geneTipEnter
        .attr('fill', n => n.id == 'NA'
                      ? color.noData
                      : palette.get(n.id))
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
                      : palette.get(n.id))
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
                    + unfAnnots.filter(n => filterByLevel(n))
                    .map(n => `c${cleanString(n.id)}`)
                    .join(' '))
        .transition()
        .duration(duration)
        .delay(delay.update)
        .style('opacity', 0);
        geneG
        .select('text.geneName')
        .attr('y', geneRect.h / 1.8)
        .transition()
        .duration(duration)
        .delay(delay.update)
        .attr('x', geneWidth/2 - geneRect.ph/2
            + (d.strand == '-'
                ? tipWidth
                : 0))
        .style('opacity', g => options.geneText
            && getShowName(g) != "."
                ? 1 : 0)
        .text(g => getShowName(g));
    }

    function enterGenes() {
        let genes = contextG
            .selectAll('g.gene')
            .data(data, d => d.anchor + d.pos);
        genes
        .transition()
        .duration(duration)
        .delay(delay.update)
        .attr('transform', d => `translate(${getX(d)}, ${getY(d)})`)
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
        .attr('transform', d => `translate(${getX(d)}, ${getY(d)})`)
        .style('opacity', 0)
        .each(d => enterGene(d))
        .transition()
        .duration(duration)
        .delay(delay.enter)
        .style('opacity', 1)

        updateHeight();
        resizeSVG();
    }

    function exitGenes() {
        let genes = contextG.selectAll('g.gene')
            .data(data, d => d.anchor + d.pos);
        genes
        .transition()
        .duration(duration)
        .delay(delay.update)
        .attr('transform', d => `translate(${getX(d)}, ${getY(d)})`);
        genes
        .exit()
        .transition()
        .duration(duration)
        .delay(delay.exit)
        .style('opacity', 0)
        .remove();

        updateHeight();
        resizeSVG();
    }

    function updateGenes() {
        // Update data-dependant variables
        let update = contextG.selectAll('g.gene')
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
        .attr('transform', d => `translate(${getX(d)}, ${getY(d)})`)
        .style('opacity', 0)
        .each(d => enterGene(d))
        .transition()
        .duration(duration)
        .delay(delay.enter)
        .style('opacity', 1)

        update
        .merge(update)
        .transition()
        .duration(duration)
        .delay(delay.update)
        .attr('transform', d => `translate(${getX(d)}, ${getY(d)})`)
        .style('opacity', 1)
        .each(d => updateGene(d));

        update.exit()
        .transition()
        .duration(duration)
        .delay(delay.exit)
        .style('opacity', 0)
        .remove();

        resizeSVG();
    }

    // Graph methods
    function updateWidth() {
        let totalWidth = +graphContainer
            .node()
            .clientWidth;
        let treeWidth = 0;
        if (newick && options.showTree) {
            treeWidth = +graphContainer
                .select('.phylogram svg')
                .attr('target-width');
        }
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

    function updateHeight() {
        // Avoid errors when tree is not present
        let targetHeight;
        try {
            targetHeight = graphContainer
                .select('.phylogram svg')
                .attr('target-height');

        } catch {
            targetHeight = max(graphContainer
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

    function resizeSVG() {
        if (options.scaleDist) {
            let farLeft = min(data, d => +d.vStart);
            let farRight = max(data, d => +d.vEnd);
            let svgWidth = farRight - farLeft + 2*margin.left;
            contextContainer
                .select('.gcontextSVG')
                .attr('width', svgWidth);
            contextG
                .attr('transform',
                      `translate(${-farLeft + margin.left},
                                 ${margin.top})`);
            container
                .select('.gene.anchor')
                .node()
                .scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center'
                });
        } else contextG
            .attr('transform',
              `translate(${margin.left}, ${margin.top})`);
    }

    function initGraph() {
      customBar = new CustomBar(data);
      customBar.drawBar(selector);
      customBar.updateLevels(annotation);

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
            .attr('transform',
                  `translate(${margin.left}, ${margin.top})`);
      graph.toggleTree(true);
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
            .attr('transform', d => `translate(${getX(d)}, ${getY(d)})`)
            .transition()
            .duration(duration)
            .delay(delay.enter)
            .style('opacity', 1)
            .each(d => enterGene(d))
    }

    // Custombar (control pannel) listeners
    function parameterListener() {
        // nSide slider
        let nSideSlider = container
            .select('.nSideSlider')
            .node()
            .noUiSlider;
        nSideSlider.on('change', () => {
            graph.nSide(Math.round(nSideSlider.get()))
        })
        // Tree toggler
        let treeToggler = container
            .select('input.toggleTree');
        treeToggler.on('change', () => {
            options.showTree = treeToggler.property('checked');
            options.showTree
                ? graph.toggleTree(true)
                : graph.toggleTree(false)
        })
        // Legend toggler
        let legendToggler = container
            .select('input.toggleLegend');
        legendToggler.on('change', () => {
            options.showLegend = legendToggler.property('checked');
            options.showLegend
                ? graph.toggleLegend(true)
                : graph.toggleLegend(false)
        })
        // Scale distance and gene width
        let scaleDist = container
            .select('input.scaleDist');
        scaleDist.on('change', () => {
            options.scaleDist = scaleDist.property('checked');
            options.scaleDist
                ? graph.scaleDist(true)
                : graph.scaleDist(false)
        })
        // Show on gene
        let showSelect = container
            .select('select.geneText');
        let showOptions = showSelect.node();
        showSelect
            .on('change', () => {
                let newShowName = showOptions
                    .options[showOptions.selectedIndex]
                    .value;
                if(newShowName != ''
                && newShowName != geneText) graph.geneText(newShowName)
            })
        // Annotation level
        let annotationLevelSelect = container
            .select('select.annotationLevel');
        let annotationLevelOptions = annotationLevelSelect
            .node();
        annotationLevelSelect
            .on('change', () => {
                let newAnnotationLevel = annotationLevelOptions
                    .options[annotationLevelOptions.selectedIndex]
                    .value;
                graph.annotation(annotation, newAnnotationLevel)
            })
        // Annotation options
        let annotationSelect = container
            .select('select.annotation')
        let annotationOptions = annotationSelect
            .node();
        annotationSelect
            .on('change', () => {
                let newAnnotation = annotationOptions
                    .options[annotationOptions.selectedIndex]
                    .value;
                customBar.updateLevels(newAnnotation);
                let annotationLevelOption = annotationLevelOptions
                    .options[annotationLevelOptions.selectedIndex]
                    .value;
                graph.annotation(newAnnotation, annotationLevelOption)
            })
        container
            .select('.shuffleColors')
            .on('click', () => graph.shuffleColors());
        container
            .select('.downloadPng')
            .on('click', () => graph.toPng());
    }

    // Legend
    function buildDomain() {
      domain = data.map(d => {
          let not = d[annotation];
          return !not
            ? []
            : typeof not == 'object'
            ? not.map(n => n.id)
            : [not]
      }).flat();
      domain = [...new Set(domain)]
    }

    function scoreAnnotation() {
        let annots = data.map(d =>
            !d[annotation]
            ? []
            : typeof d[annotation] == 'object'
            ? d[annotation].filter(n => filterByLevel(n))
            : [{id:d[annotation]}])
            .flat();
        let count = counter(annots, 'id')
        let total = Object
            .values(count)
            .reduce((total, d) => total +d , 0)
        let uniqueAnnotation = {};
        annots.forEach(n => uniqueAnnotation[n.id] = n);
        uniqueAnnotation = [...Object.values(uniqueAnnotation)]
        uniqueAnnotation.forEach(n => {
            n.score = +(count[n.id] / total).toFixed(3)
        })
        uniqueAnnotation.sort((a, b) => b.score - a.score)
        return uniqueAnnotation
    }

    function updatePalette(shuffle=false) {
      buildDomain();
      palette.buildPalette(domain);
      if (shuffle) palette.shuffle();
    }

    function drawLegend() {
        // Sticky legend
        let stickyLegend = legendContainer.append('div')
                    .attr('class', 'sticky-legend sticky')
        // Legend is split to optimize space
        splitLegend = stickyLegend
                    .append('div')
                    .attr('class', 'split-legend annotation-legend mt-1')
                    .style('width', '300px')
        // Legend title
        splitLegend.append('div')
                   .attr('class', 'legend-title font-weight-bold');
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

    function updateLegend() {
        // Update title
        splitLegend.select('.legend-title')
            .style('opacity', 0)
            .html(annotation.toUpperCase())
            .transition()
            .duration(duration)
            .style('opacity', 1);
        let uniqueAnnotation = scoreAnnotation()
        let factor = 60;
        // Scale legend to fit all data
        let legendHeight = uniqueAnnotation.length * factor;
        splitLegend
            .transition()
            .duration(duration)
            .delay(delay.update)
            .style("height",
                Math.min(window.innerHeight - 50,
                         legendHeight + 100) + "px");
        let legendEntry = splitLegend
            .selectAll('.lgnd-entry')
            .data(uniqueAnnotation);
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
            .style("fill", n => palette.get(n.id));
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
                    ? graph.excludeAnnotation(n.id, false)
                    : graph.excludeAnnotation(n.id, true)
            })
        checkboxLabelEnter
            .append('span')
            .attr("class", "form-check-label");
        checkboxDivEnter
            .append("div")
            .attr("class", "w-100 lgnd-entry-description")
            .style("display", "block")
            .style("max-height", "45px")
            .style("height", "45px");

        let legendEntryMerged = legendEntryEnter
            .merge(legendEntry)
            .attr('class', n => 'lgnd-entry '
                    + `lgnd${cleanString(n.id)}`)
        legendEntryMerged
            .select('circle')
            .transition()
            .duration(duration)
            .style("fill", n => palette.get(n.id));
        legendEntryMerged
            .select('input')
            .attr('class', n => 'mt-0 form-check-input rounded-pill '
                + `form-check-legend lgnd-switch lgnd${cleanString(n.id)}`)
        legendEntryMerged
            .select('span')
            .html(n => !URLs[annotation]
                ? `<em>${n.id}</em>`
                : '<a href="'
                    + URLs[annotation].b
                    + String(n.id)
                    + URLs[annotation].a
                    + '" target="_blank" style="outline:none;">'
                    + String(n.id)+'</a>');
        legendEntryMerged
            .select('.lgnd-entry-description')
            .html(n => `<strong class='font-weight-bold'>\
                    conservation: ${n.score}\
                    </strong><br>`
                    + (n.description || ''));
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

    // Tree callbacks
    function treeLeafEnter(l) {
        graph.excludeAnchor(l.data.name, false)
    }

    function treeLeafExit(l) {
        graph.excludeAnchor(l.data.name, true)
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
            graph.excludeAnchor(l.data.name, !excluded);
        }
    }

    // GeCoViz modifiers
    graph.contextData = function(d) {
        if (!arguments.length) return data;
        unfData = swapStrands(d);
        updateData();
        updatePalette();
        if(initialized) updateGenes();
        return graph;
    }

    graph.tree = function(n, fields = ['name']) {
        if (!arguments.length) return newick;
        if (n) newick = parseNewick(n, fields);
        newickFields = fields;
        return graph;
    }

    graph.heatmap = function(heatmapData, vars) {
        graphContainer
            .insert('div', '.contextAndLegend')
            .attr('class', 'heatmapContainer p-1')
        heatmap = new Heatmap(`${selector} .heatmapContainer`,
            heatmapData,
            vars,
            { getX: undefined, getY: getY })
    }

    graph.toggleTree = async function(toggle=true) {
        let phylogramContainer = select(selector)
                .select('.phylogramContainer');
        let phylogramSVG = phylogramContainer
          .select('svg');
        if (newick && toggle) {
            if (!phylogramSVG.node()) {
                buildTree(selector + ' .phylogramContainer',
                      newick, newickFields,
                      {
                      enterEach : treeLeafEnter,
                      enterMouseOver : treeLeafMouseOver,
                      enterMouseLeave : treeLeafMouseLeave,
                      enterClick : treeLeafClick,
                      exitEach : treeLeafExit,
                      });
            }
            let targetWidth = phylogramContainer
                .select('svg')
                .attr('target-width');
            phylogramContainer
                .transition()
                .duration(duration)
                .delay(delay.update)
                .style('width', `${targetWidth}px`);
            phylogramContainer
                .transition()
                .duration(duration)
                .delay(delay.enter)
                .style('opacity', 1);
        } else {
            phylogramContainer
                .style('opacity', 0)
                .style('width', 0);
        }
        graph.nSide(nSide);
    }

    graph.toggleLegend = function (toggle=true) {
      let legendContainer = select(selector)
            .select('.legendContainer');
      let splitLegend = legendContainer.select('.split-legend');
      if (toggle) {
          legendContainer.style('width', '320px');
          splitLegend.style('width', '300px');
          legendContainer
            .transition()
            .duration(duration)
            .delay(delay.enter)
            .style('opacity', 1);
      }
      else {
          legendContainer
              .style('opacity', 0)
              .style('width', 0)
          splitLegend
              .style('width', 0);
      }
      graph.nSide(nSide);
    }

    graph.scaleDist = function(scale=true) {
      options.scaleDist = scale;
      graph.nSide(nSide);
    }

    graph.nSide = function(d) {
        if (!arguments.length) return nSide;
        nSide = d;
        if(initialized) updateWidth();
        updateData();
        if(initialized) updateLegend();
        if(initialized) updateGenes();
        return graph;
    }

    graph.annotation = function(not, level = undefined) {
        if (!arguments.length) return annotation;
        annotation = not;
        annotationLevel = level;
        updatePalette();
        if(initialized) updateLegend();
        if(initialized) updateAnnotation();
        return graph;
    }

    graph.excludeAnnotation = function (annotationID, exclude=true) {
        if (!arguments.length) return excludedAnnotation;
        if (exclude && !excludedAnnotation.includes(annotationID))
          { excludedAnnotation.push(annotationID) }
        else if (!exclude && excludedAnnotation.includes(annotationID))
          { excludedAnnotation = excludedAnnotation.filter(n => n != annotationID) }
        if(initialized) updateAnnotation();
        return graph;
    }

    graph.excludeAnchor = function(anchor, exclude=true) {
        if (!arguments.length) return excludedAnchors;
        if (exclude && !excludedAnchors.includes(anchor))
          {
            excludedAnchors.push(anchor)
            updateData();
            exitGenes();
          }
        else if (!exclude && excludedAnchors.includes(anchor))
          {
            excludedAnchors = excludedAnchors.filter(a => a!= anchor)
            updateData();
            enterGenes();
          }
        return graph;
    }

    graph.geneText = function(field) {
        if (!arguments.length) return geneText;
        geneText = field;
        updateGeneText();
        return graph;
    }

    graph.shuffleColors = function() {
        updatePalette(true);
        if(initialized) updateLegend();
        if(initialized) updateAnnotation();
        return graph;
    }

    graph.toPng = function() {
      let toDownload = document.querySelector(selector + ' .graph-container');
      let dimensions = toDownload.getBoundingClientRect();
      let legendHeight = select(selector)
          .select('.split-legend')
          .node()
          .getBoundingClientRect()
          .height + 7;
      let scrollX = $(document).scrollLeft();
      let scrollY = $(document).scrollTop();
      //['.phylogram',
      //'.gcontext',
       //'.split-legend'].forEach(d => {
           //select(selector)
            //.select(d)
            //.style('border-color', 'transparent');
      //})
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
               //select(selector)
                //.select(d)
                //.style('border-color', 'var(--dark-gray)');
            //})
        });
        return graph;
    }

    graph.draw = function() {
        initialized = true;
        initGraph();
        parameterListener();
        updateHeight();
        PopperClick(selector + ' .gcontext');
        return graph;
    }

    return graph;
}

export default GeCoViz
