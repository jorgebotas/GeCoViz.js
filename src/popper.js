var PopperCreate = function(selector, d, URLs) {
    function get_PopperHTML(d) {
        let arrayData = []
        Object.entries(d).forEach(([key, field]) => {
            let fieldData = "";
            if (nonEmptyArray(field)) {
                fieldData = '<ul class="popper-ul">\
                    <li class="popper-ul-title">'
                    + key.toUpperCase()
                    + '</li>';
                field.forEach(f => {
                    fieldData += '<li>';
                    fieldData += !URLs[key]
                    ? `<em>${f.id}</em>`
                    : '<a href="'
                        + URLs[key].b
                        + String(f.id)
                        + URLs[key].a
                        + '" target="_blank" style="outline:none;">'
                        + String(f.id)+'</a>';
;
                    levelData = !f.level
                            ? ''
                            : f.leveDesc
                            ? ' (level: '
                                + f.level
                                + ', description: '
                                + d.levelDesc
                                + ')'
                            : ' (level: '
                                + f.level
                                + ')';
                    fieldData += levelData
                    fieldData += '<br>' + f.description + '</li>';
                })
                fieldData += '</ul>';
            } else {}
            if (fieldData) arrayData.push(fieldData)
        })
        var popperHTML = '';
        console.log(d)
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
        if (d.pfam) {
             let dom_id = 'dom' + cleanString(d.anchor + d.pos);
             popperHTML += '<div class="py-2" id=' + dom_id + '></div>'
        }
        if (d.GMGFam) {
            popperHTML += '<br><strong>GMGFam</strong><br>' +
                                     d.GMGFam + '<br><br>';
        }
        if (d.taxonomy
            && d.taxonomy.length
            && !nonEmptyArray(n.taxonomy)){
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
    if (d.pfam) {
        var doms = new Set();
        d.pfam.forEach(d => {
            if (d.class && d.class != '') {
                doms.add(d.class)
            }
        })
        var colors = colors269;
        var palette = d3.scaleOrdinal()
                        .domain(doms)
                        .range(colors);
        draw_protDomains(selector + ' #dom' + cleanString(d.anchor + d.pos),
                         d.pfam,
                         1000,
                         //Math.abs((+d.end) - (+d.start)),
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
    console.log(id)
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
        let poppers = document.querySelectorAll(selector + ' .popper')
        poppers.forEach(popper => {
            popper.removeAttribute('data-show');
        });
        if (!e.altKey) {
            let targetID;
            ['gene', 'leaf', 'popper'].forEach(c => {
                try { targetID = lookForParent(e.target, c).id } catch {};
            })
            targetID = !targetID ? e.target.id : targetID;
            targetID = targetID.trim()
            if (['gene',  'leaf', 'popr'].indexOf(targetID.slice(0,4)) > -1){
                targetID = targetID.slice(4);
                let popper = document.querySelector(selector + ' .popper#popr'+targetID);
                //let popperDims = popper.getBoundingClientRect();
                //let refbound = document.querySelector(selector + ' g.gene#gene'+targetID)
                                       //.getBoundingClientRect();
                  //if (refbound.right+popperDims.width/2 > window.innerWidth){
                      //d3.select(selector + ' .popper#popr'+targetID)
                          //.select(selector + ' .popper-arrow')
                          //.style('right', window.innerWidth-refbound.right+'px');
                  //} else if(refbound.left < popperDims.width/2) {
                      //d3.select(selector + ' .popper#popr'+targetID)
                          //.select(selector + ' .popper-arrow')
                          //.style('left', refbound.left+'px')
                          //.style('right', '');
                  //}
                try { popper.setAttribute('data-show', '') } catch {}
            }
        }
    });
}
