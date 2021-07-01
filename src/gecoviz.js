// import css
//import "../static/assets/tabler/css/tabler.min.css"
//import "../static/assets/tabler/css/tabler-vendors.min.css"

import "../static/css/gecoviz.css";
import "../static/css/colors.css";
import "../static/css/customBar.css";
import "../static/css/popper.css";
import "../static/css/scrollbar.css";

// Async functions support
import "core-js/stable";
import "regenerator-runtime/runtime";
import { extent, min, max, scaleLinear, select } from "d3";
import domtoimage from "dom-to-image";
import { saveAs } from "file-saver";
import Heatmap from "@jbotas/d3-heatmap";
import CustomBar from "./customBar";
import { addCheckbox, cleanString, counter, triggerEvent } from "./helpers";
import parseNewick from "./newick";
import Palette from "./palette";
import { PopperCreate, PopperClick } from "./popper";
import Tree from "./tree";
import Sorter from "./sorter.js";

function GeCoViz(selector, opts) {
  var graph = function () {
    return this;
  };
  var container = select(selector);
  var containerY = container.node().getBoundingClientRect().top + 40;
  var viewport = document.querySelector("html");
  var initialized = false;
  var unfData = [];
  var data = [];
  var heatmap;
  var heatmapData = { data: undefined, unfData: undefined, vars: undefined };
  var tree;
  var treeData = { newick: undefined, leafText: "name", fields: ["name"] };
  var timer; // avoid overloading when collapsing tree nodes
  var anchors = [];
  var swappedAnchors = [];
  var nSide = 2;
  var zoom = 1;
  var width = 700;
  var height = 700;
  var margin = {
    top: 10,
    left: 7,
  };
  var geneText = "";
  var annotation = "";
  var annotationLevel;
  var excludedAnnotation = [];
  var excludedAnchors = [];
  var scoredAnnotation;
  var URLs = {
    kegg: {
      b: "https://www.kegg.jp/dbget-bin/www_bget?map",
      a: "",
    },
    unigene: {
      b: "http://gmgc.embl.de/search.cgi?search_id=GMGC10.",
      a: ".UNKNOWN&search_seq=",
    },
    eggnog: {
      b: "http://eggnog5.embl.de/#/app/results?target_nogs=",
      a: "",
    },
    pfam: {
      b: "https://pfam.xfam.org/family/",
      a: "",
    },
    //taxonomy : {
    //b : 'https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?mode=Info&id=',
    //a : '&&lvl=3&lin=f&keep=1&srchmode=1&unlock'
    //}
    taxonomy: {
      b: "https://gtdb.ecogenomic.org/searches?s=al&q=",
      a: "",
    },
  };
  var duration = 300;
  var delay = {
    enter: duration * 2,
    update: duration,
    exit: 0,
  };
  var geneRect = {
    w: (width - 2) / (2 * nSide + 1),
    h: opts && opts.geneRect ? opts.geneRect.h : 16,
    ph: 20,
    pv: 5,
  };
  var tipWidth = (2 * geneRect.ph) / 5;
  var domain = [];
  var palette = new Palette();
  var customBar;
  var options = {
    showBar: true,
    geneText: true,
    showTree: false,
    showHeatmap: false,
    showLegend: true,
    scaleDist: false,
  };
  // Color variables
  var color = {
    primary: "var(--indigo)",
    noData: "var(--nodata)",
    highlight: "var(--highlight)",
    black: "var(--black)",
    white: "var(--white)",
    darkGray: "var(--dark-gray)",
    sand: "var(--sand)",
    darkPurple: "var(--dark-purple)",
    purple: "var(--purple)",
  };
  var leafColor = {
    stroke: color.purple,
    fill: color.sand,
  };
  // Containers
  var graphContainer;
  var treeContainer;
  var heatmapContainer;
  var contextAndLegend;
  var contextContainer;
  var contextG;
  var distScaleContainer;
  var legendContainer;
  var splitLegend;

  // Data formatters
  function filterAnchor(a) {
    return !excludedAnchors.includes(cleanString(a)) ? true : false;
  }

  function computeCoordinates() {
    function buildScale() {
      const sizeRange = extent(
        data.map((d) => {
          let size = Math.abs(+d.end - +d.start);
          return size > 0 ? size : undefined;
        })
      );
      // TipWidth + a small rect is the minimum width
      let scaleRange = [tipWidth + 10, undefined];
      const initialScale = scaleLinear()
        .domain([0, sizeRange[0]])
        .range([0, scaleRange[0]]);
      scaleRange[1] = initialScale(sizeRange[1]);
      const scale = scaleLinear()
            .domain(sizeRange)
            .range(scaleRange);
      const distScale = (d) => {
        const sign = +d / Math.abs(+d);
        const scaled = +scale(Math.abs(+d)) * zoom;
        return +(sign * scaled);
      };
      const sizeScale = (s) => {
        let scaled = Math.max(distScale(s) - tipWidth, 0);
        scaled += geneRect.ph; // It will be subtracted afterwards
        return scaled;
      };
      return [distScale, sizeScale, scale];
    }

    function getDist(d, neigh, swapped, pos) {
      let dist;
      if (!swapped)
        dist = pos > 0 ? +d.start - +neigh.end : +neigh.start - +d.end;
      else dist = pos > 0 ? +neigh.start - +d.end : +d.start - +neigh.end;
      return dist;
    }

    const [distScale, sizeScale, scale] = buildScale();

    // Data should be sorted to compute virtual start and end
    data = Sorter.sort(
      data,
      (a, b) => Math.abs(parseInt(b.pos)) < Math.abs(parseInt(a.pos))
    );
    data.sort((a, b) => b.anchor < a.anchor);

    data.forEach((d) => {
      let swapped = swappedAnchors.includes(d.anchor);
      if (+d.start && +d.end) {
        let anchoredData = data.filter((el) => el.anchor == d.anchor);
        d.size = +Math.abs(+d.end - +d.start);
        d.vSize = sizeScale(d.size);
        if (+d.pos == 0) {
          d.vStart = (width - 7) / 2;
          d.vEnd = +d.vStart + distScale(d.size);
        } else {
          if (+d.pos > 0) {
            let neigh = anchoredData.find((n) => +n.pos == +d.pos - 1);
            let dist = distScale(getDist(d, neigh, swapped, 1)) || 0;
            d.vStart = +neigh.vEnd + dist;
            d.vEnd = d.vStart + distScale(d.size);
          } else if (+d.pos < 0) {
            let neigh = anchoredData.find((n) => +n.pos == +d.pos + 1);
            let dist = distScale(getDist(d, neigh, swapped, -1)) || 0;
            d.vEnd = +neigh.vStart - dist;
            d.vStart = d.vEnd - distScale(d.size);
          }
        }
      } else {
        d.vSize = geneRect.w;
        d.vStart = undefined;
        d.vEnd = undefined;
      }
    });
    return scale
  }

  function updateData() {
    data = unfData.filter(
      (d) => Math.abs(+d.pos) <= nSide && filterAnchor(d.anchor)
    );
    anchors = data.filter((d) => d.pos == 0);
    if (heatmapData.unfData)
      heatmapData.data = heatmapData.unfData.filter((d) =>
        filterAnchor(d.anchor)
      );
      if (options.scaleDist) {
          const scale = computeCoordinates();
          if (initialized) {
              // Remove previous scale if present
              distScaleContainer
                  .selectAll('*')
                  .remove();
              drawScale(distScaleContainer, scale, 0, 0, 'bp');
              distScaleContainer
                .style('opacity', 1);
          }
      } else if (initialized) {
          distScaleContainer
            .style('opacity', 0);
      }

  }

  function swapStrands(unswapped) {
    swappedAnchors = unswapped.map((d) => {
      if (d.pos == 0 && d.strand == "-") return d.anchor;
    });
    let swapped = [];
    unswapped.forEach((d) => {
      let dCopy = Object.assign({}, d);
      if (swappedAnchors.includes(d.anchor)) {
        dCopy.pos = -1 * +d.pos;
        dCopy.strand = d.strand == "+" ? "-" : "+";
      }
      swapped.push(dCopy);
    });
    return swapped;
  }

  // Coordinate getters
  function getX(d) {
    if (options.scaleDist) return +d.vStart;
    else return (+d.pos + nSide) * geneRect.w;
  }

  function getY(d) {
    if (treeData.newick) {
      try {
        const y = select(`${selector} #leaf${cleanString(d.anchor)}`).node()
          .__data__.x;
        return y - 11.2;
      } catch {
        return -1000;
      }
    }
    return anchors.findIndex((a) => a.anchor == d.anchor) * geneRect.h;
  }

  function inViewPort(d) {
    // Check x coordinate
    const x = getX(d);
    if (!x && x != 0) return false;
    // Check y coordinate
    const y = getY(d) + containerY;
    const minY = viewport.scrollTop;
    const maxY = minY + viewport.clientHeight;
    const margin = 50;
    return y >= 0 && y >= (minY - margin) && y <= (maxY + margin);
  }

  // Tip and arrow strokes
  function getArrow(d, x0, rectWidth, tipWidth) {
    let tipPath, strokePath;
    let rect = geneRect;
    if (d.strand == "-") {
      tipPath = [
        "M",
        x0 + 0.5,
        " ",
        "0",
        " ",
        "L",
        x0 - tipWidth,
        " ",
        (rect.h - rect.pv) / 2,
        " ",
        "L",
        x0 + 0.5,
        " ",
        rect.h - rect.pv,
        " ",
        "Z",
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
        "Z",
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
        "Z",
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
        "Z",
      ].join("");
    }
    return { tipPath: tipPath, strokePath: strokePath };
  }

  // Gene text methods
  function getShowName(d) {
    let geneName = d[geneText];
    if (!["", "NA", undefined].includes(geneName)) {
      let size = +Math.floor(d.geneWidth / 8);
      let name = d[geneText];
      if (size < name.length) {
        name = name.slice(0, size);
      }
      geneName = name;
    } else {
      geneName = ".";
    }
    return geneName;
  }

  function updateGeneText() {
    contextG
      .selectAll("text.geneName")
      .transition()
      .duration(duration)
      .style("opacity", 0)
      .transition()
      .duration(duration)
      .style("opacity", (g) =>
        options.geneText && getShowName(g) != "." ? 1 : 0
      )
      .text((g) => getShowName(g));
  }

  // Annotation methods
  function filterByLevel(d) {
    // Assert there is an id...
    if (!d.id || d.id.trim() == "") return false;
    // Filter by level
    return !annotationLevel
      ? true
      : !d.level
      ? true
      : d.level == annotationLevel;
  }

  function filterAnnotation(n) {
    return !n.id || excludedAnnotation.includes(n.id) || n.id.trim() == ""
      ? false
      : filterByLevel(n);
  }

  function formatAnnotation(n) {
    let unfAnnots =
      !n || n.length == 0
        ? [{ id: "NA" }]
        : typeof n == "object"
        ? n
        : [{ id: n }];
    let annots = unfAnnots.filter((n) => filterAnnotation(n));
    annots = annots.length == 0 ? [{ id: "NA" }] : annots;
    return {
      unfAnnots: unfAnnots,
      annots: annots,
    };
  }

  function updateAnnotation() {
    contextG.selectAll("g.gene").each((g) => updateGene(g));
  }

  // Gene listeners
  function hoverGene(d) {
    let geneG = contextG.select("#gene" + cleanString(d.anchor + d.pos));
    let stroke = geneG.select("path.stroke");
    let geneName = geneG.select("text.geneName");
    function mouseOver() {
      stroke.style("opacity", 1);
      geneName.style("fill", color.black);
      // Highlight tree
      let leaf = graphContainer.select("#leaf" + cleanString(d.anchor));
      let leafCircle = leaf.select("circle");
      let leafText = leaf.select("text");
      leafCircle
        .style("stroke", color.highlight)
        .style("fill", color.highlight);
      leafText.style("fill", color.highlight);
      let annots = d[annotation];
      if (typeof annots != "object") annots = [{ id: annots }];
      annots.filter(filterByLevel).forEach((n) => {
        // Highlight legend
        let div = graphContainer.select(`.lgnd${cleanString(n.id)}`);
        let t = div.select("a");
        t = t.nodes().length == 0 ? div.select("em") : t;
        t.style("color", color.highlight);
      });
    }
    function mouseLeave() {
      stroke.style("opacity", 0);
      geneName.style("fill", color.white);
      // Highlight tree
      let leaf = graphContainer.select("#leaf" + cleanString(d.anchor));
      let leafCircle = leaf.select("circle");
      let leafText = leaf.select("text");
      leafCircle
        .style("stroke", leafColor.stroke)
        .style("fill", leafColor.fill);
      leafText.style("fill", color.darkGray);
      let annots = d[annotation];
      if (typeof annots != "object") annots = [{ id: annots }];
      annots.filter(filterByLevel).forEach((n) => {
        // Highlight legend
        let div = graphContainer.select(`.lgnd${cleanString(n.id)}`);
        let t = div.select("a");
        t = t.nodes().length == 0 ? div.select("em") : t;
        t.style("color", color.primary);
      });
    }
    return {
      mouseOver: mouseOver,
      mouseLeave: mouseLeave,
    };
  }

  // Gene methods
  function enterGene(d) {
    let geneG = contextG.select(`#gene${cleanString(d.anchor)}${d.pos}`);
    let { unfAnnots, annots } = formatAnnotation(d[annotation]);
    let nRect = +annots.length > 0 ? +annots.length : 1;
    let geneWidth;
    if (options.scaleDist) geneWidth = d.vSize;
    else geneWidth = geneRect.w;
    d.geneWidth = geneWidth;
    let barWidth = (geneWidth - geneRect.ph) / nRect;
    let x0;
    x0 = d.strand == "-" ? tipWidth : 0;
    let geneRects = geneG.selectAll("rect.gene-rect").data(annots, (n) => n.id);
    geneRects
      .enter()
      .append("rect")
      .attr("class", "gene-rect")
      .attr("fill", (n) => (n.id == "NA" ? color.noData : palette.get(n.id)))
      .attr("x", (_, i) => x0 + i * barWidth)
      .attr("y", 0)
      .attr("width", barWidth + 0.5)
      .attr("height", geneRect.h - geneRect.pv);
    let { tipPath, strokePath } = getArrow(d, x0, geneWidth, tipWidth);
    geneG
      .selectAll("path.gene-tip")
      .data(
        (d) => (d.strand == "-" ? [annots[0]] : [annots[annots.length - 1]]),
        (n) => n.id
      )
      .enter()
      .append("path")
      .attr("d", tipPath)
      .attr("class", "gene-tip")
      .attr("fill", (n) => (n.id == "NA" ? color.noData : palette.get(n.id)));
    geneG.append("path").attr("d", strokePath).attr("class", "light-stroke");
    geneG
      .append("path")
      .attr("d", strokePath)
      .attr(
        "class",
        "stroke " +
          unfAnnots
            .filter((n) => filterByLevel(n))
            .map((n) => `c${cleanString(n.id)}`)
            .join(" ")
      )
      .style("opacity", 0);
    geneG
      .append("text")
      .attr("class", "geneName")
      .attr(
        "x",
        geneWidth / 2 - geneRect.ph / 2 + (d.strand == "-" ? tipWidth : 0)
      )
      .attr("y", geneRect.h / 1.8)
      .style("opacity", (g) =>
        options.geneText && getShowName(g) != "." ? 1 : 0
      )
      .text((g) => getShowName(g));
    // Hover rationale
    let { mouseOver, mouseLeave } = hoverGene(d);
    // Gene SVG group
    geneG.node().childNodes.forEach(child => {
      child.addEventListener("click", () =>
        PopperCreate(selector + " .gcontext", d, URLs)
      );
      child.addEventListener("mouseover", mouseOver);
      child.addEventListener("mouseleave", mouseLeave);
    });
  }

  function updateGene(d) {
    let geneG = contextG.select(`#gene${cleanString(d.anchor)}${d.pos}`);
    // let popperShow = PopperCreate(selector + ' .gcontext', d, URLs);
    let { unfAnnots, annots } = formatAnnotation(d[annotation]);
    let nRect = +annots.length > 0 ? +annots.length : 1;
    let geneWidth;
    if (options.scaleDist) geneWidth = d.vSize;
    else geneWidth = geneRect.w;
    d.geneWidth = geneWidth;
    let barWidth = (geneWidth - geneRect.ph) / nRect;
    let x0 = d.strand == "-" ? tipWidth : 0;
    let geneRects = geneG.selectAll("rect.gene-rect").data(annots, (n) => n.id);
    let geneRectsEnter = geneRects
      .enter()
      .insert("rect", "path")
      .attr("class", "gene-rect")
      .attr("fill", (n) => (n.id == "NA" ? color.noData : palette.get(n.id)))
      .attr("x", (_, i) => x0 + i * barWidth)
      .attr("y", 0)
      .attr("width", 0)
      .attr("height", geneRect.h - geneRect.pv)
      .style("opacity", 0);
    let { mouseOver, mouseLeave } = hoverGene(d);
    geneRectsEnter
      .on("mouseover", mouseOver)
      .on("mouseleave", mouseLeave)
      .on("click", () => PopperCreate(selector + " .gcontext", d, URLs));
    // Updating gene rects
    let mergedGeneRects = geneRectsEnter.merge(geneRects);
    mergedGeneRects
      .transition()
      .duration(duration)
      .delay(delay.update)
      .attr("x", (_, i) => x0 + i * barWidth)
      .attr("width", barWidth + 0.5);
    mergedGeneRects
      .transition()
      .duration(duration)
      .delay(delay.enter)
      .attr("fill", (n) => (n.id == "NA" ? color.noData : palette.get(n.id)))
      .style("opacity", 1);
    geneRects
      .exit()
      .transition()
      .duration(duration)
      .style("opacity", 0)
      .remove();

    let { tipPath, strokePath } = getArrow(d, x0, geneWidth, tipWidth);
    let geneTip = geneG.selectAll("path.gene-tip").data(
      (d) => (d.strand == "-" ? [annots[0]] : [annots[annots.length - 1]]),
      (n) => n.id
    );
    let geneTipEnter = geneTip
      .enter()
      .insert("path", "path.light-stroke")
      .attr("class", "gene-tip");
    geneTipEnter
      .attr("fill", (n) => (n.id == "NA" ? color.noData : palette.get(n.id)))
      .style("opacity", 0);
    let geneTipMerged = geneTipEnter.merge(geneTip);
    geneTipMerged
      .transition()
      .duration(duration)
      .delay(delay.update)
      .attr("d", tipPath);
    geneTipMerged
      .transition()
      .duration(duration)
      .delay(delay.enter)
      .attr("fill", (n) => (n.id == "NA" ? color.noData : palette.get(n.id)))
      .style("opacity", 1);
    geneTip.exit().transition().duration(duration).style("opacity", 0).remove();
    geneG
      .select("path.light-stroke")
      .transition()
      .duration(duration)
      .delay(delay.update)
      .attr("d", strokePath);
    geneG
      .select("path.stroke")
      .attr(
        "class",
        "stroke " +
          unfAnnots
            .filter((n) => filterByLevel(n))
            .map((n) => `c${cleanString(n.id)}`)
            .join(" ")
      )
      .transition()
      .duration(duration)
      .delay(delay.update)
      .attr("d", strokePath)
      .style("opacity", 0);
    geneG
      .select("text.geneName")
      .attr("y", geneRect.h / 1.8)
      .transition()
      .duration(duration)
      .delay(delay.update)
      .attr(
        "x",
        geneWidth / 2 - geneRect.ph / 2 + (d.strand == "-" ? tipWidth : 0)
      )
      .style("opacity", (g) =>
        options.geneText && getShowName(g) != "." ? 1 : 0
      )
      .text((g) => getShowName(g));
  }

  function updateGenes() {
    // Update data-dependant variables
    const genes = contextG
      .selectAll("g.gene")
      .data(data.filter(inViewPort), (d) => d.anchor + d.pos);

    genes
      .enter()
      .append("g")
      .attr("class", (d) => {
        let cl = "gene";
        cl += d.pos == 0 ? " anchor" : "";
        return cl;
      })
      .attr("id", (d) => "gene" + cleanString(d.anchor + d.pos))
      .attr("transform", (d) => `translate(${getX(d)}, ${getY(d)})`)
      .style("opacity", 0)
      .each((d) => enterGene(d))
      .transition()
      .duration(duration)
      .delay(delay.enter)
      .style("opacity", 1);

    const update = genes.merge(genes);
    update
      .transition()
      .duration(duration)
      .delay(delay.update)
      .attr("transform", (d) => `translate(${getX(d)}, ${getY(d)})`)
      .each((d) => updateGene(d));

    genes
      .exit()
      .transition()
      .duration(duration)
      .delay(delay.exit)
      .style("opacity", 0)
      .remove();

    resizeSVG();
  }

  function updateViewPortGenes() {
    const genes = contextG
      .selectAll("g.gene")
      .data(data.filter(inViewPort), (d) => d.anchor + d.pos);

    genes
      .enter()
      .append("g")
      .attr("class", (d) => {
        let cl = "gene";
        cl += d.pos == 0 ? " anchor" : "";
        return cl;
      })
      .attr("id", (d) => "gene" + cleanString(d.anchor + d.pos))
      .attr("transform", (d) => `translate(${getX(d)}, ${getY(d)})`)
      .style("opacity", 0)
      .each((d) => enterGene(d))
      .style("opacity", 1);

    genes
      .exit()
      .remove();
  }

  // Graph methods
  function updateWidth() {
    let totalWidth = +graphContainer.node().clientWidth;
    let nonContextWidth = 0;
    if (treeData.newick && options.showTree) {
      let treeWidth = +graphContainer
        .select(".phylogram svg")
        .attr("target-width");
      treeWidth = Math.min(0.4 * totalWidth, treeWidth);
      nonContextWidth += treeWidth;
    } else {
      nonContextWidth += 10;
    }
    if (heatmap && options.showHeatmap) {
      let heatmapWidth = +heatmapContainer.attr("target-width");
      nonContextWidth += heatmapWidth;
    }
    width = totalWidth - nonContextWidth;
    graphContainer.select(".gcontextAndLegend").style("width", `${width}px`);
    if (options.showLegend) width -= 320; // Legend width
    width -= 10; // Account for svg padding
    graphContainer.select(".gcontextSVG").attr("width", width);
    geneRect.w = (width - 2) / (2 * nSide + 1);
  }

  function updateHeight() {
    // Avoid errors when tree is not present
    let targetHeight;
    try {
      targetHeight = +graphContainer
        .select(".phylogram svg")
        .attr("target-height");
    } catch {
      targetHeight =
        max(
          graphContainer
            .selectAll("g.gene")
            .nodes()
            .map((n) => +n.getBoundingClientRect().top)
        ) -
        +graphContainer.node().getBoundingClientRect().top +
        geneRect.h +
        10;
    }
    height = targetHeight;
    graphContainer
      .select(".gcontextSVG")
      .transition()
      .duration(duration)
      .delay(delay.update)
      .attr("height", height - 10); // Accomodate distScaleContainer
    graphContainer
      .transition()
      .duration(duration)
      .delay(delay.update / 2)
      .style("height", `${targetHeight + 40}px`);
    if (splitLegend && options.showLegend) updateLegendHeight();
  }

  function resizeSVG() {
    if (options.scaleDist) {
      const farLeft = min(data, (d) => +d.vStart);
      const farRight = max(data, (d) => +d.vEnd);
      const svgWidth = farRight - farLeft + 2 * margin.left;
      contextContainer.select(".gcontextSVG").attr("width", svgWidth);
      contextG.attr(
        "transform",
        `translate(${-farLeft + margin.left},
                                 ${margin.top})`
      );
    } else
      contextG.attr("transform", `translate(${margin.left}, ${margin.top})`);
  }

  function scrollIntoView() {
      container.select(".gene.anchor").node().scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
  }

  function drawHeatmap() {
    if (heatmapData.data)
      heatmap = new Heatmap(
        selector + " .heatmapContainer .innerContainer",
        heatmapData.data,
        heatmapData.vars,
        { getX: undefined, getY: getY },
        {
          margin: {
            top: 8.5,
            right: 5,
            bottom: 5,
            left: 5,
          },
          height: height,
          showX: false,
          showY: false,
          rect: { height: geneRect.h },
        }
      );
  }

  function initGraph() {
    customBar = new CustomBar(data, treeData.fields);
    customBar.drawBar(selector, options);
    customBar.updateLevels(annotation);

    graphContainer = container.append("div")
      .attr("class", "graph-container");

    contextAndLegend = graphContainer
      .append("div")
      .attr("class", "gcontextAndLegend pb-2")
      .style("opacity", 0);
    contextContainer = contextAndLegend
      .append("div")
      .attr("class", "gcontext innerContainer m-1");
    contextAndLegend
      .transition()
      .duration(duration)
      .delay(delay.enter)
      .style("opacity", 1);
    legendContainer = contextAndLegend
      .append("div")
      .attr("class", "p-1 pt-0 legendContainer")
      .append("div")
      .attr("class", "legend w-100");

    treeContainer = graphContainer
      .insert("div", ".gcontextAndLegend")
      .attr("class", "treeContainer p-1");
    drawTree();

    if (options.showTree) updateHeight();

    heatmapContainer = graphContainer
      .insert("div", ".gcontextAndLegend")
      .attr("class", "heatmapContainer p-1");
    heatmapContainer.append("div")
      .attr("class", "innerContainer");
    drawHeatmap();

    updateWidth();

    const contextSVG = contextContainer
      .insert("svg", ".legendContainer")
      .attr("class", "gcontextSVG")
      .attr("width", width)
      .attr("height", height);
    contextG = contextSVG
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);
    distScaleContainer = contextContainer
      .append('svg')
      .attr('class', 'scale')
      .append('g');

    contextG
      .selectAll("g.gene")
      .data(data.filter(inViewPort), (d) => d.anchor + d.pos)
      .enter()
      .append("g")
      .attr("class", (d) => {
        let cl = "gene";
        cl += d.pos == 0 ? " anchor" : "";
        return cl;
      })
      .attr("id", (d) => "gene" + cleanString(d.anchor + d.pos))
      .attr("transform", (d) => `translate(${getX(d)}, ${getY(d)})`)
      .transition()
      .duration(duration)
      .delay(delay.enter)
      .style("opacity", 1)
      .each((d) => enterGene(d));

    graphContainer
      .selectAll(".innerContainer")
      .style("opacity", 0)
      .transition()
      .duration(duration)
      .delay(delay.enter)
      .style("opacity", 1);

    // Update height if no tree was shown
    if (!options.showTree) updateHeight();
    // Draw legend after target height is known
    drawLegend();
    // Toggle elements that will be shown
    graph.toggleCustomBar(options.showBar);
    graph.toggleTree(options.showTree);
    graph.toggleHeatmap(options.showHeatmap);
    graph.toggleLegend(options.showLegend);
  }

  // Custombar (control pannel) listeners
  function parameterListener() {
    // nSide slider
    let nSideSlider = container.select(".nSideSlider").node().noUiSlider;
    nSideSlider.on("change", () => {
      graph.nSide(Math.round(nSideSlider.get()));
    });
    // Tree toggler
    let treeToggler = container.select("input.toggleTree");
    treeToggler.on("change", () => {
      options.showTree = treeToggler.property("checked");
      options.showTree ? graph.toggleTree(true) : graph.toggleTree(false);
    });
    // Heatmap toggler
    let heatmapToggler = container.select("input.toggleHeatmap");
    heatmapToggler.on("change", () => {
      options.showHeatmap = heatmapToggler.property("checked");
      options.showHeatmap
        ? graph.toggleHeatmap(true)
        : graph.toggleHeatmap(false);
    });
    // Legend toggler
    let legendToggler = container.select("input.toggleLegend");
    legendToggler.on("change", () => {
      options.showLegend = legendToggler.property("checked");
      options.showLegend ? graph.toggleLegend(true) : graph.toggleLegend(false);
    });
    // Scale distance and gene width
    let scaleDist = container.select("input.scaleDist");
    scaleDist.on("change", () => {
      options.scaleDist = scaleDist.property("checked");
      options.scaleDist ? graph.scaleDist(true) : graph.scaleDist(false);
    });
    // Zoom slider
    let zoomSlider = container.select(".zoomSlider").node().noUiSlider;
    zoomSlider.on("change", () => {
      graph.zoom(zoomSlider.get());
    });
    // Show on leaf
    let leafTextSelect = container.select("select.leafText");
    if (leafTextSelect.node()) {
      let leafTextOptions = leafTextSelect.node();
      leafTextSelect.on("change", () => {
        let newLeafText =
          leafTextOptions.options[leafTextOptions.selectedIndex].value;
        if (newLeafText != "" && newLeafText != tree.leafText()) {
          tree.leafText(newLeafText);
            if (initialized) {
                updateWidth();
                updateGenes();
            }        
        }
      });
    }
    // Show on gene
    let showSelect = container.select("select.geneText");
    let showOptions = showSelect.node();
    showSelect.on("change", () => {
      let newShowName = showOptions.options[showOptions.selectedIndex].value;
      if (newShowName != "" && newShowName != geneText)
        graph.geneText(newShowName);
    });
    // Annotation level
    let annotationLevelSelect = container.select("select.annotationLevel");
    let annotationLevelOptions = annotationLevelSelect.node();
    annotationLevelSelect.on("change", () => {
      let newAnnotationLevel =
        annotationLevelOptions.options[annotationLevelOptions.selectedIndex]
          .value;
      graph.annotation(annotation, newAnnotationLevel);
    });
    // Annotation options
    let annotationSelect = container.select("select.annotation");
    let annotationOptions = annotationSelect.node();
    annotationSelect.on("change", () => {
      let newAnnotation =
        annotationOptions.options[annotationOptions.selectedIndex].value;
      customBar.updateLevels(newAnnotation);
      let annotationLevelOption =
        annotationLevelOptions.options[annotationLevelOptions.selectedIndex]
          .value;
      graph.annotation(newAnnotation, annotationLevelOption);
    });
    container.select(".shuffleColors").on("click", () => graph.shuffleColors());
    container.select(".downloadPng").on("click", () => graph.toSvg());

    // Scrolling listener
    window.addEventListener("scroll", updateViewPortGenes, { passive: true });
  }

  // Legend
  function buildDomain() {
    domain = data
      .map((d) => {
        let annot = d[annotation];
        return !annot
          ? []
          : typeof not == "object"
          ? annot.map(a => a.id)
          : [annot];
      })
      .flat();
    domain = [...new Set(domain)];
  }

  function scoreAnnotation() {
    let annots = data
      .map(d =>
        !d[annotation]
          ? []
          : typeof d[annotation] == "object"
          ? d[annotation].filter(a => filterByLevel(a))
          : [{ id: d[annotation] }]
      );
    const annotated_neighs = annots.filter(a => a.length > 0).length
    annots = annots.flat();
    const count = counter(annots, "id");
    let uniqueAnnotation = {};
    annots.forEach(a => (uniqueAnnotation[a.id] = a));
    uniqueAnnotation = [...Object.values(uniqueAnnotation)];
    uniqueAnnotation.forEach(a => {
      a.score = +(count[a.id] / annotated_neighs).toFixed(3);
    });
    uniqueAnnotation.sort((a, b) => b.score - a.score);
    return uniqueAnnotation;
  }

  function updatePalette(shuffle = false) {
    buildDomain();
    palette.buildPalette(domain);
    if (shuffle) palette.shuffle();
  }

  function drawLegend() {
    // Remove items inside legend (if any)
    legendContainer.selectAll("*").remove();
    // Sticky legend
    const stickyLegend = legendContainer
      .append("div")
      .attr("class", "sticky-legend sticky");
    // Legend is split to optimize space
    splitLegend = stickyLegend
      .append("div")
      .attr("class", "split-legend annotation-legend bg-sand mt-1")
      .style("width", "300px");
    // Legend title
    splitLegend.append("div").attr("class", "legend-title font-weight-bold");
    // Select-all checkbox
    addCheckbox(
      splitLegend
        .append("div")
        .attr("class", "pl-3")
        .style("display", "flex")
        .style("height", "35px"),
      "Select all",
      "form-check-legend lgnd-toggleAll"
    );
    // No data legend entry
    let noData = splitLegend
      .append("div")
      .style("outline", "none")
      .style("display", "flex")
      .style("padding-top", "6.5px")
      .style("height", "35px");
    let noDataSVG = noData
      .append("svg")
      .attr("width", 40)
      .attr("height", 20)
      .style("display", "inline-block");
    noDataSVG
      .append("circle")
      .attr("r", 6)
      .attr("cx", 20)
      .attr("cy", 6.5)
      .style("fill", color.noData);
    noData
      .append("div")
      .style("display", "inline-block")
      .style("outline", "none")
      .html("No data");
    updateLegend(splitLegend);
    // Toggle checkboxes if clicked
    let legendSwitch = splitLegend.select(".lgnd-toggleAll");
    legendSwitch.on("change", () => {
      let switches = splitLegend.selectAll(".lgnd-switch");
      legendSwitch.property("checked")
        ? switches.property("checked", true)
        : switches.property("checked", false);
      switches.nodes().forEach((s) => triggerEvent(s, "change"));
    });
  }

  function updateLegend() {
    // Update title
    splitLegend
      .select(".legend-title")
      .style("opacity", 0)
      .html(annotation.toUpperCase())
      .transition()
      .duration(duration)
      .style("opacity", 1);
    scoredAnnotation = scoreAnnotation();
    updateLegendHeight();
    let legendEntry = splitLegend
      .selectAll(".lgnd-entry")
      .data(scoredAnnotation);
    let legendEntryEnter = legendEntry
      .enter()
      .append("div")
      .attr("class", "lgnd-entry")
      .style("outline", "none")
      .style("display", "flex");
    legendEntryEnter.on("mouseover", (_, n) =>
      graphContainer
        .selectAll(`path.stroke.c${cleanString(n.id)}`)
        .style("opacity", 1)
    );
    legendEntryEnter.on("mouseleave", (_, n) =>
      graphContainer
        .selectAll(`path.stroke.c${cleanString(n.id)}`)
        .style("opacity", 0)
    );
    legendEntryEnter
      .append("svg")
      .attr("width", 40)
      .attr("height", 20)
      .style("display", "inline-block")
      .style("margin-top", "6px")
      .append("circle")
      .attr("r", 6)
      .attr("cx", 20)
      .attr("cy", 6.5)
      .style("fill", (n) => palette.get(n.id));
    let checkboxDivEnter = legendEntryEnter
      .append("div")
      .style("display", "inline-block")
      .style("outline", "none");
    let checkboxLabelEnter = checkboxDivEnter
      .append("label")
      .attr("class", "form-check m-1 ml-2");
    checkboxLabelEnter
      .append("input")
      .attr("type", "checkbox")
      .attr("checked", "")
      .attr("style", "margin-top:0 !important;")
      .on("change", (e, n) => {
        e.target.checked
          ? graph.excludeAnnotation(n.id, false)
          : graph.excludeAnnotation(n.id, true);
      });
    checkboxLabelEnter.append("span").attr("class", "form-check-label");
    checkboxDivEnter
      .append("div")
      .attr("class", "w-100 lgnd-entry-description")
      .style("display", "block")
      .style("max-height", "45px")
      .style("height", "45px");

    let legendEntryMerged = legendEntryEnter
      .merge(legendEntry)
      .attr("class", (n) => "lgnd-entry " + `lgnd${cleanString(n.id)}`);
    legendEntryMerged
      .select("circle")
      .transition()
      .duration(duration)
      .style("fill", (n) => palette.get(n.id));
    legendEntryMerged
      .select("input")
      .attr(
        "class",
        (n) =>
          "mt-0 form-check-input rounded-pill " +
          `form-check-legend lgnd-switch lgnd${cleanString(n.id)}`
      );
    legendEntryMerged
      .select("span")
      .html((n) =>
        !URLs[annotation]
          ? `<em>${n.id}</em>`
          : '<a href="' +
            URLs[annotation].b +
            String(n.id) +
            URLs[annotation].a +
            '" target="_blank" style="outline:none;">' +
            String(n.id) +
            "</a>"
      );
    legendEntryMerged.select(".lgnd-entry-description").html(
      (n) =>
        `<strong class='font-weight-bold'>\
                    conservation: ${n.score}\
                    </strong><br>` + (n.description || "")
    );
    legendEntry.exit().style("opacity", 0).remove();
    splitLegend
      .selectAll("div")
      .style("opacity", 0)
      .transition()
      .duration(duration)
      .delay(delay.enter)
      .style("opacity", 1);
  }

  function updateLegendHeight() {
    let factor = 60;
    // Scale legend to fit all data
    let legendHeight =
      (scoredAnnotation.length > 1 ? scoredAnnotation.length : 2) * factor;
    legendHeight = min([
      +window.innerHeight - 50,
      legendHeight + 100,
      height + 32,
    ]);
    legendContainer.style("height", `calc(100% - ${legendHeight}px)`);
    splitLegend
      .transition()
      .duration(duration)
      .delay(delay.update)
      .style("height", legendHeight + "px");
    return legendHeight;
  }

  function drawScale(vis, scale, x, y, units='') {
    let ticks = scale.ticks(2);
    ticks = [0, ticks[1] - ticks[0] || ticks[0]];
    let sticks = [scale(ticks[0]), scale(ticks[1]) * (zoom || 1)];
    vis.append('svg:line')
        .attr('y1', y)
        .attr('y2', y)
        .attr('x1', x + sticks[0])
        .attr('x2', x + sticks[1])
        .attr("stroke", color.darkGray)
        .attr("stroke-width", "1.5px");
    vis.append('svg:line')
        .attr('y1', y + 5)
        .attr('y2', y - 5)
        .attr('x1', x +  sticks[0])
        .attr('x2', x + sticks[0])
        .attr("stroke", color.darkGray)
        .attr("stroke-width", "1.5px");
    vis.append('svg:line')
        .attr('y1', y + 5)
        .attr('y2', y - 5)
        .attr('x1', x + sticks[1])
        .attr('x2', x + sticks[1])
        .attr("stroke", color.darkGray)
        .attr("stroke-width", "1.5px");
    vis.append("svg:text")
        .attr("class", "rule")
        .attr("x", x + sticks[0]+(sticks[1]-sticks[0])/2)
        .attr("y", y)
        .attr("dy", -7)
        .attr("text-anchor", "middle")
        .attr('font-size', '11px')
        .attr('fill', color.darkGray)
        .text(ticks[1] + units);
  }

  // Tree callbacks
  function treeLeafEnter(l) {
    graph.excludeAnchor(cleanString(l.data.name), false);
  }

  function treeLeafExit(l) {
    graph.excludeAnchor(cleanString(l.data.name), true);
  }

  function treeLeafMouseOver(_, l) {
    let anchor = cleanString(l.data.name);
    let genes = graphContainer.selectAll(`[id^="gene${anchor}"]`);
    genes.select(".stroke").style("opacity", 1);
  }

  function treeLeafMouseLeave(_, l) {
    let anchor = cleanString(l.data.name);
    let genes = graphContainer.selectAll(`[id^="gene${anchor}"]`);
    genes.select(".stroke").style("opacity", 0);
  }

  function treeLeafClick(event, l) {
    if (event.altKey) {
      let name = cleanString(l.data.name);
      let excluded = excludedAnchors.includes(name);
      graph.excludeAnchor(name, !excluded);
    }
  }

  function drawTree() {
    if (treeData.newick)
      tree = Tree(
        selector + " .treeContainer",
        treeData.newick,
        treeData.leafText,
        treeData.fields,
        {
          enterEach: treeLeafEnter,
          enterMouseOver: treeLeafMouseOver,
          enterMouseLeave: treeLeafMouseLeave,
          enterClick: treeLeafClick,
          exitEach: treeLeafExit,
        },
        { show: options.showTree }
      );
  }

  // GECOVIZ MODIFIERS

  // Data
  graph.contextData = function (d) {
    if (!arguments.length) return data;
    unfData = swapStrands(d);
    updateData();
    updatePalette();
    if (initialized) updateGenes();
    return graph;
  };

  graph.treeData = function (newick, leafText, fields) {
    if (!arguments.length) return treeData.newick;
    if (fields) treeData.fields = fields;
    if (leafText) treeData.leafText = leafText
    else treeData.leafText = treeData.fields[0];
    if (newick) treeData.newick = parseNewick(newick, treeData.fields);
    if (treeData.newick) options.showTree = true;
    return graph;
  };

  graph.heatmapData = function (newHeatmapData, vars) {
    if (!arguments.length) return heatmapData;
    if (newHeatmapData) {
      heatmapData.unfData = newHeatmapData;
      heatmapData.data = heatmapData.unfData.filter((d) =>
        filterAnchor(d.anchor)
      );
    }
    if (vars) heatmapData.vars = vars;
    if (heatmapData.data) options.showHeatmap = true;
    return graph;
  };

  // Togglers
  graph.toggleTree = function (show = true) {
    if (treeData.newick && show) {
      // Adjust width
      let targetWidth = treeContainer.select("svg").attr("target-width");
      treeContainer
        .transition()
        .duration(duration)
        .delay(delay.update)
        .style("width", `${targetWidth}px`);
      treeContainer
        .transition()
        .duration(duration)
        .delay(delay.enter)
        .style("opacity", 1);
    } else {
      treeContainer.style("opacity", 0).style("width", 0);
      treeContainer
        .transition()
        .duration(0)
        .delay(delay.enter)
        .style("width", 0);
    }
    if (initialized) {
      updateWidth();
      updateGenes();
    }
  };

  graph.toggleHeatmap = function (show = true) {
    if (heatmapData.data && show) {
      // Adjust width
      heatmapContainer.style("display", "block");
      let targetWidth = +heatmapContainer.select("svg").attr("width") + 10;
      heatmapContainer
        .attr("target-width", targetWidth)
        .transition()
        .duration(duration)
        .delay(delay.update)
        .style("width", `${targetWidth}px`);
      heatmapContainer
        .transition()
        .duration(duration)
        .delay(delay.enter)
        .style("opacity", 1);
    } else {
      heatmapContainer
        .style("display", "none")
        .style("opacity", 0)
        .style("width", 0);
    }
    if (initialized) {
      updateWidth();
      updateGenes();
    }
  };

  graph.toggleLegend = function (show = true) {
    let legendContainer = select(selector).select(".legendContainer");
    let splitLegend = legendContainer.select(".split-legend");
    if (show) {
      legendContainer.style("display", "block").style("width", "320px");
      splitLegend.style("width", "300px");
      legendContainer
        .transition()
        .duration(duration)
        .delay(delay.enter)
        .style("opacity", 1);
    } else {
      legendContainer
        .style("display", "none")
        .style("opacity", 0)
        .style("width", 0);
      splitLegend.style("width", 0);
    }
    if (initialized) {
      updateWidth();
      updateGenes();
    }
  };

  graph.toggleCustomBar = function (show = true) {
    let customBarContainer = container.select(".customBar");
    if (show) customBarContainer.style("display", "flex");
    else customBarContainer.style("display", "none");
  };

  // Graph modifiers
  graph.scaleDist = function (scale = true) {
    options.scaleDist = scale;
    updateData();
    if (initialized) {
      updateWidth();
      updateGenes();
      scrollIntoView();
    }
    return graph;
  };

  graph.zoom = function (z = 1) {
    zoom = z;
    if (options.scaleDist) {
      updateData();
      if (initialized) {
          updateWidth();
          updateGenes();
          scrollIntoView();
      }
    }
    return graph;
  };

  graph.viewPort = function(vp) {
    if (!vp) return viewport;
    viewport = vp;
    if (initialized) updateGenes();
    return graph;
  };

  graph.nSide = function (d) {
    if (!arguments.length) return nSide;
    nSide = d;
    updateData();
    if (initialized) {
        updateLegend();
        updateWidth();
        updateGenes();
        scrollIntoView();
    }
    return graph;
  };

  graph.annotation = function (not, level = undefined) {
    if (!arguments.length) return annotation;
    annotation = not;
    annotationLevel = level;
    updatePalette();
    if (initialized) {
        updateLegend();
        updateAnnotation();
    }
    return graph;
  };

  graph.excludeAnnotation = function (annotationID, exclude = true) {
    if (!arguments.length) return excludedAnnotation;
      if (timer) clearTimeout(timer);
    if (exclude && !excludedAnnotation.includes(annotationID)) {
      excludedAnnotation.push(annotationID);
    } else if (!exclude && excludedAnnotation.includes(annotationID)) {
      excludedAnnotation = excludedAnnotation.filter((n) => n != annotationID);
    }
    if (initialized) 
      timer = setTimeout(() => updateAnnotation(), 100);
    return graph;
  };

  graph.excludeAnchor = function (anchor, exclude = true) {
    if (!arguments.length) return excludedAnchors;
    if (timer) clearTimeout(timer);
    if (exclude && !excludedAnchors.includes(anchor)) {
      excludedAnchors.push(anchor);
      updateData();
      if (options.showHeatmap && heatmapData.data)
        heatmap.updateData(heatmapData.data);
    } else if (!exclude && excludedAnchors.includes(anchor)) {
      excludedAnchors = excludedAnchors.filter((a) => a != anchor);
      updateData();
      if (options.showHeatmap && heatmapData.data)
        heatmap.updateData(heatmapData.data);
    }
    timer = setTimeout(() => {
        if (initialized) {
            updateWidth();
            updateHeight();
            updateGenes();
        }
    }, duration + 100);
    return graph;
  };

  graph.geneText = function (field) {
    if (!arguments.length) return geneText;
    geneText = field;
    if (initialized) updateGeneText();
    return graph;
  };

  graph.shuffleColors = function () {
    updatePalette(true);
    if (initialized) updateLegend();
    if (initialized) updateAnnotation();
    return graph;
  };

  graph.options = function (opts) {
    Object.entries(opts).forEach(([k, v]) => {
      options[k] = v;
    });
    return graph;
  };

  // Download
  graph.toPng = function () {
    function filterNodes(node) {
      if (node.tagName == "input") return false;
      let classes = ["popper", "stroke"];
      if (
        node.classList &&
        [...node.classList].some((c) => classes.includes(c))
      )
        return false;
      return true;
    }
    // Set cursor to progress
    select(":root").style("cursor", "progress");
    // Format legend
    splitLegend.node().classList.remove("bg-sand");
    splitLegend.select(".pl-3").remove(); // Remove toggleAll
    splitLegend.selectAll("input").remove(); // Remove checkboxes
    let legendEntries = splitLegend.selectAll(".lgnd-entry");
    legendEntries.select("label").style("padding-left", ".5rem");
    let toDownload = graphContainer.node();
    domtoimage
      .toPng(toDownload, { filter: filterNodes })
      .then((blob) => saveAs(blob, "GeCoViz.png"))
      .then(() => drawLegend())
      .then(() => select(":root").style("cursor", "default"));
    return graph;
  };

  graph.toSvg = function() {
    // Set cursor to progress
    select(":root").style("cursor", "progress");
    const toDownload = select(graphContainer.node().cloneNode(true));
    toDownload.selectAll(".popper").remove();  // remove popovers
    toDownload.selectAll(".stroke").remove();  // remove strokes
    const splitLegend = toDownload.select('.split-legend');
    splitLegend.select(".pl-3").remove(); // Remove toggleAll
    splitLegend.selectAll("input").remove(); // Remove checkboxes
    const legendEntries = splitLegend.selectAll(".lgnd-entry");
    legendEntries.select("label").style("padding-left", ".5rem");
    
    //apply_css(svg, document.styleSheets[0]);
    const svg_xml = (new XMLSerializer()).serializeToString(toDownload.node());
    const content = "data:image/svg+xml;base64," + btoa(svg_xml);
    const element = document.createElement("a");
    element.setAttribute("href", encodeURI(content));
    element.setAttribute("download", "GeCoViz.svg");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    select(":root").style("cursor", "default");

    return graph;

    //// Apply CSS rules to elements contained in a (cloned) container
    //function apply_css(container, stylesheet) {
        //let styles = [];
        //Array.from(stylesheet.rules).forEach(r => {
            //const style = r.cssText;
            //if (style) 
                //styles.push(style);
        //})
        //const style_element = document.createElement("style");
        //style_element.innerHTML = styles.join("\n");
        //container.appendChild(style_element);
    //}


  }

  // Required draw method
  graph.draw = function () {
    if (!initialized) {
      initGraph();
      initialized = true;
      parameterListener();
      PopperClick(selector);
    }
    return graph;
  };

  return graph;
}

export default GeCoViz;
