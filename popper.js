var PopperCreate = function(selector, d, URLs) {
    function get_PopperHTML(d) {
        let arrayData = []
        Object.entries(d).forEach(([key, field]) => {
            let fieldData = "";
            if (typeof field === 'object'
                && typeof field[Symbol.iterator] === 'function'
                && field.length > 0) {
                fieldData = '<ul class="popper-ul">\
                    <li class="popper-ul-title">'
                    + key
                    + '</li>';
                field.forEach(f => {
                    url = URLs[key]
                        ? URLs[key]
                        : { b:"", a:"" };
                    fieldData += '<li><a href='
                                    + url.b
                                    + f.id
                                    + url.a
                                    + ' target="_blank">'
                                    + f.id
                                    +'</a>';
                    fieldData += f.level
                            ? ' (level: ' + f.level + ')'
                            : '';
                    fieldData += '<br>' + f.description + '</li>';
                })
                fieldData += '</ul>';
            } else {}
            if (fieldData) arrayData.push(fieldData)
        })
        var popperHTML = '';
        if (d.gene) {
            popperHTML += '<strong>Gene</strong><br>' +
                            d.gene + '<br>';
        }
        if (d.showName) {
            popperHTML += 'Gene name: ' + d.showName + '<br>'
        }
        if (d.start && d.end) {
            popperHTML += 'Length: ' + Math.abs(+d.end - +d.start) + 'bp<br>';
            popperHTML += 'Start: ' + d.start + 'bp<br>' +
                           'End: ' + d.end + 'bp<br>';
        }
        if (d.strand) {
             popperHTML += 'Strand: ' + d.strand + '<br>';
         }
        if(d.frequency) {
            popperHTML += 'Frequency: ' + d.frequency + '<br>';
        }
        if (d.nContig) {
            popperHTML += 'Analysed contigs: ' + d.nContig + '<br>';
        }
        if (d.domains) {
             let dom_id = 'dom' + cleanString(d.anchor + d.pos);
             popperHTML += '<div class="py-2" id=' + dom_id + '></div>'
        }
        if (d.GMGFam) {
            popperHTML += '<br><strong>GMGFam</strong><br>' +
                                     d.GMGFam + '<br><br>';
        }
        if (d.taxonomy && d.taxonomy.length){
            popperHTML += '<strong>Taxonomic assignation</strong><br>';
            popperHTML += d.taxonomy + '<br>' //.join('<br>')
        }
        if (arrayData.length > 0) popperHTML +=
            '<div class="popper-uls">'
                + arrayData.reduce((t, d) => t + d)
                +'</div>'
         if (d.metadata) {
            popperHTML += '<br><br><strong>Metadata</strong><br>' +
                        d.metadata
         }
        return popperHTML
    }

    var geneID = cleanString(d.anchor + d.pos);
    let oldPopper = d3.select(selector + ' .popper#popr' + geneID)
    if (oldPopper.nodes().length > 0) oldPopper.remove();
    var popperD3 = d3.select(selector)
               .append('div')
               .attr('class', 'popper col-lg-4 col-md-8 col-sm-10')
               .attr('id', 'popr' + geneID);
    var popperHTML = get_PopperHTML(d);
    // popper content
    popperD3.append('div')
             .attr('class', 'popper-content')
             .html(popperHTML);
    if (d.domains) {
        var doms = new Set();
        d.domains.forEach(d => {
            if (d.class && d.class != '') {
                doms.add(d.class)
            }
        })
        var colors = [
            '#6574cd',
            '#e6ac00',
            '#ffa3b2',
            '#254F93',
            '#c9b2fd',
            '#fcaf81',
            '#a9dff7',
            '#FF5C8D',
            '#838383',
            '#5F33FF',
            '#c7e3aa',
            '#abfdcb',
            '#D81E5B',
            '#47DAFF',
            '#c4ab77',
            '#A1A314',
            '#fff600',
            '#53257E',
            '#1e90ff',
            '#B6549A',
            '#7cd407',
            '#948ad6',
            '#7ba0d5',
            '#fcc6f8',
            '#fec24c',
            '#A40E4C',
            '#dd5a95',
            '#12982d',
            '#27bda9',
            '#F0736A',
            '#9354e7',
            '#cbd5e3',
            '#93605D',
            '#FFE770',
            '#6C9D7F',
            '#2c23e4',
            '#ff6200',
            '#406362'
              ];
        var palette = scale.ordinal()
                        .domain(doms)
                        .range(colors);
        draw_protDomains(selector + ' #dom' + cleanString(d.anchor + d.pos),
                         d.domains,
                         d.size,
                         250,
                         7,
                         palette,
                         URLs.pfam.b)
    }
    // Popper arrow
    popperD3.append('div')
             .attr('class', 'popper-arrow');

    var popper  = document.querySelector(selector + ' .popper#popr' + geneID);
    function show() {
        var poppers = document.querySelectorAll(selector + ' .popper')
        poppers.forEach(p => {
            p.removeAttribute('data-show');
        });
        let popper  = document
            .querySelector(selector + ' .popper#popr' + geneID);
        let ref = document
            .querySelector(selector + ' g.gene#gene' + geneID);
        popper.setAttribute('data-show', '');
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
    popper.addEventListener('click', show);
    return show;
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
    popperD3.append('div')
            .attr('class', 'popper-content card-body h6 pt-2')
            .html(popperHTML);
    // popper arrow
    popperD3.append('div')
            .attr('class', 'popper-arrow');
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
        var poppers = document.querySelectorAll(selector + ' .popper')
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
            while (name && name != 'HTML') {
                if ($(el).hasClass(targetClass)) {
                    return el;
                }
                el = el.parentElement;
                name = el.nodeName;
            }
            return undefined;
        }
        var poppers = document.querySelectorAll(selector + ' .popper')
        poppers.forEach(popper => {
            popper.removeAttribute('data-show');
        });
        var targetID;
        ['gene', 'leaf', 'popper'].forEach(c => {
            try { targetID = lookForParent(e.target, c).id } catch {};
        })
        targetID = !targetID ? e.target.id : targetID;
        targetID = targetID.trim()
        if (['gene',  'leaf', 'popr'].indexOf(targetID.slice(0,4)) > -1){
            targetID = targetID.slice(4);
            var popper = document.querySelector(selector + ' .popper#popr'+targetID);
            /*var refbound = document.querySelector(selector + ' g.gene#gene'+targetID)*/
                                   //.getBoundingClientRect();
              //if (refbound.right+195 > window.innerWidth){
                  //d3.select(selector + ' .popper#popr'+targetID)
                      //.select(selector + ' .popper-arrow')
                      //.style('right', window.innerWidth-refbound.right+'px');
              //} else if(refbound.left < 195) {
                  //d3.select(selector + ' .popper#popr'+targetID)
                      //.select(selector + ' .popper-arrow')
                      //.style('left', refbound.left+'px')
                      //.style('right', '');
              /*}*/
            popper.setAttribute('data-show', '');
          }

    });
}
