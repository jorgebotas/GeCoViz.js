var PopperCreate = function(selector, d) {
    function get_PopperHTML(d) {
        var keggData = "<ul id='popper'>\
            <li id='popper-cog'>KEGG</li>";
        var cogData = "<ul id='popper'>\
            <li id='popper-cog'>eggNOG</li>";
        // KEGG data
        if (d.kegg && d.kegg.length) {
            d.kegg.forEach(k => {
                keggData += '<li><a href=" \
                                https://www.kegg.jp/dbget-bin/www_bget?map' +
                                k.id + '" target="_blank">'+k.id+'</a> ';
                keggData += k.percentage ? "(" + k.percentage + ")\n" : "";
                keggData += k.description + "</li>";
            })
            keggData += "</ul>"
        } else {
            keggData = "";
        }
        // eggNOG data
        if (d.eggnog && d.eggnog.length) {
            d.eggnog.forEach(c => {
                cogData += "<li><em>" + c.id + "</em> ";
                cogData += c.percentage ? "(" + c.percentage + ")" : "";
                cogData += c.level ? "(level: " + c.percentage + ")\n" : "";
                cogData += c.description + "</li>";
            })
            cogData += "</ul>"
        } else {
            cogData = "";
        }
        var popper_html = "";
        if (["", "NA", undefined].every(i => i!=d.name)){
            popper_html += d.name + "<br>";
        }
        if (d.strand) {
             popper_html += "Strand: " + d.strand + "<br>";
         }
        if (d.gene) {
            popper_html += "<br><strong>Gene</strong><br>" +
                            d.gene + "<br>";
        }
        if (d.start && d.end) {
            popper_html += "Length: " + Math.abs(+d.end - +d.start) + "bp<br>";
            popper_html += "Start: " + d.start + "bp<br>" +
                           "End: " + d.end + "bp<br>";
        }
        if(d.frequency) {
            popper_html += "Frequency: " + d.frequency + "<br>";
        }
        if (d.nContig) {
            popper_html += "Analysed contigs: " + d.nContig + "<br>";
        }
        if (d.domains) {
             let dom_id = 'dom' + cleanString(d.anchor + d.pos);
             popper_html += "<div class='py-2' id='" + dom_id + "'></div>"
        }
        if (d.GMGFam) {
            popper_html += "<br><strong>GMGFam</strong><br>" +
                                     d.GMGFam + "<br><br>";
        }
        if (d.taxonomy && d.taxonomy.length){
            popper_html += "<strong>Taxonomic assignation</strong><br>";
            popper_html += d.taxonomy.join("<br>") + "<br>"
        }
        if (keggData != "" || cogData != "") {
             popper_html += "<div id='popper'>" +
                            keggData +
                            cogData +
                            "</div>";
         }
         if (d.metadata) {
            popper_html += "<br><br><strong>Metadata</strong><br>" +
                        d.metadata
         }
        return popper_html
    }

    var geneID = cleanString(d.anchor + d.pos);
    let oldPopper = d3.select(selector + ' .popper#popr' + geneID)
    if (oldPopper.nodes().length > 0) oldPopper.remove();
    var popperD3 = d3.select(selector)
               .append("div")
               .attr("class", "popper col-md-4 col-sm-4")
               .attr("id", "popr" + geneID);
    var popperHTML = get_PopperHTML(d);
    // popper content
    popperD3.append("div")
             .attr("class", "popper-content")
             .html(popperHTML);
    if (d.domains) {
        var doms = new Set();
        d.domains.forEach(d => {
            if (d.class && d.class != "") {
                doms.add(d.class)
            }
        })
        var colors = [
            '#6574cd',
            '#e6ac00',
            '#ffa3b2',
            "#254F93",
            "#c9b2fd",
            "#fcaf81",
            "#a9dff7",
            "#FF5C8D",
            "#838383",
            "#5F33FF",
            "#c7e3aa",
            "#abfdcb",
            "#D81E5B",
            "#47DAFF",
            "#c4ab77",
            "#A1A314",
            "#fff600",
            "#53257E",
            "#1e90ff",
            "#B6549A",
            "#7cd407",
            "#948ad6",
            "#7ba0d5",
            "#fcc6f8",
            "#fec24c",
            "#A40E4C",
            "#dd5a95",
            "#12982d",
            "#27bda9",
            "#F0736A",
            "#9354e7",
            "#cbd5e3",
            "#93605D",
            "#FFE770",
            "#6C9D7F",
            "#2c23e4",
            "#ff6200",
            "#406362"
              ];
        var palette = scale.ordinal()
                        .domain(doms)
                        .range(colors);
        draw_protDomains(selector + " #dom" + cleanString(d.anchor + d.pos),
                         d.domains,
                         d.size,
                         250,
                         7,
                         palette,
                         'https://pfam.xfam.org/family/')
    }
    // Popper arrow
    popperD3.append("div")
             .attr("class", "popper-arrow");

    var popper  = document.querySelector(selector + " .popper#popr" + geneID);
    var ref = document.querySelector(selector + " g.gene#gene" + geneID);
    function create() {
      // Popper Instance
      Popper.createPopper(ref, popper, {
      modifiers: [
        {
          name: 'offset',
          options: {
            offset: [-4, 5],
          },
        },
          {
              name: 'flip',
              options: {
                  fallbackPlacements: ['top'],
              }
          }
      ],
        });
      }
    function show() {
        hide();
        popper.setAttribute('data-show', '');
        create();
    }
    function hide() {
        var poppers = document.querySelectorAll(selector + " .popper")
        poppers.forEach(popper => {
            popper.removeAttribute('data-show');
        });
    };
    const showEvents = ['click'];
    showEvents.forEach(function (event) {
        ref.childNodes.forEach(c => {
            c.addEventListener(event, show)
        });
        popper.addEventListener(event, show);
    });
}

var addPopper = function(selector,
                    id,
                    popperHTML,
                    popperClass) {
    var popperD3 = d3.select(selector)
                    .append('div')
                    .attr('class', 'popper ' + popperClass)
                    .attr('id', 'popr' + id);
    // popper content
    popperD3.append("div")
            .attr("class", "popper-content card-body h6 pt-2")
            .html(popperHTML);
    // popper arrow
    popperD3.append("div")
            .attr("class", "popper-arrow");
    var popper = document.querySelector(selector + ' .popper#popr' + id);
    var ref = document.querySelector(selector + ' g#leaf' + id);
    function create() {
        // Popper Instance
        Popper.createPopper(ref, popper, {
          placement: 'right',
          modifiers: [
            {
              name: 'offset',
              options: {
                offset: [0, 10],
              },
            },
              {
                  name: 'flip',
                  options: {
                      fallbackPlacements: ['left'],
                  }
              }
          ],
        });
      }
      function show() {
        hide();
        popper.setAttribute('data-show', '');
        create();
      }
      function hide() {
        var poppers = document.querySelectorAll(selector + " .popper")
        poppers.forEach(popper => {
            popper.removeAttribute('data-show');
        });
      };
      const showEvents = ['click'];
      showEvents.forEach(function (event) {
        popper.addEventListener(event, show);
        ref.addEventListener(event, show);
      });
}

var PopperClick = function(selector) {

    $(document).click(e => {
        // Helper function
        function lookForParent(element,
                             targetClass){
            let el = element;
            let name = el.nodeName;
            while (name && name != "HTML") {
                if ($(el).hasClass(targetClass)) {
                    return el;
                }
                el = el.parentElement;
                name = el.nodeName;
            }
            return undefined;
        }
        var poppers = document.querySelectorAll(selector + " .popper")
        poppers.forEach(popper => {
            popper.removeAttribute('data-show');
        });
        var targetID;
        ['gene', 'leaf', 'popper'].forEach(c => {
            try { targetID = lookForParent(e.target, c).id } catch {};
        })
        targetID = !targetID ? e.target.id : targetID;
        if (['gene',  'leaf', 'popr'].indexOf(targetID.slice(0,4)) > -1){
            targetID = targetID.slice(4);
            var popper = document.querySelector(selector + " .popper#popr"+targetID);
            /*var refbound = document.querySelector(selector + " g.gene#gene"+targetID)*/
                                   //.getBoundingClientRect();
              //if (refbound.right+195 > window.innerWidth){
                  //d3.select(selector + " .popper#popr"+targetID)
                      //.select(selector + " .popper-arrow")
                      //.style("right", window.innerWidth-refbound.right+'px');
              //} else if(refbound.left < 195) {
                  //d3.select(selector + " .popper#popr"+targetID)
                      //.select(selector + " .popper-arrow")
                      //.style("left", refbound.left+'px')
                      //.style("right", "");
              /*}*/
            popper.setAttribute("data-show", "");
          }

    });
}
