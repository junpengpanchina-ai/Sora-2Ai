module.exports=[891677,a=>{"use strict";var b=a.i(518891),c=a.i(696948),d=(0,c.__name)((a,d,g,h)=>{a.attr("class",g);let{width:i,height:j,x:k,y:l}=e(a,d);(0,b.configureSvgSize)(a,j,i,h);let m=f(k,l,i,j,d);a.attr("viewBox",m),c.log.debug(`viewBox configured: ${m} with padding: ${d}`)},"setupViewPortForSVG"),e=(0,c.__name)((a,b)=>{let c=a.node()?.getBBox()||{width:0,height:0,x:0,y:0};return{width:c.width+2*b,height:c.height+2*b,x:c.x,y:c.y}},"calculateDimensionsWithPadding"),f=(0,c.__name)((a,b,c,d,e)=>`${a-e} ${b-e} ${c} ${d}`,"createViewBox");a.s(["setupViewPortForSVG",()=>d])},815846,a=>{"use strict";var b=a.i(696948);a.i(43066);var c=a.i(455784),d=(0,b.__name)((a,b)=>{let d;return"sandbox"===b&&(d=(0,c.select)("#i"+a)),("sandbox"===b?(0,c.select)(d.nodes()[0].contentDocument.body):(0,c.select)("body")).select(`[id="${a}"]`)},"getDiagramElement");a.s(["getDiagramElement",()=>d])},260448,a=>{"use strict";var b=(0,a.i(696948).__name)(()=>`
  /* Font Awesome icon styling - consolidated */
  .label-icon {
    display: inline-block;
    height: 1em;
    overflow: visible;
    vertical-align: -0.125em;
  }
  
  .node .label-icon path {
    fill: currentColor;
    stroke: revert;
    stroke-width: revert;
  }
`,"getIconStyles");a.s(["getIconStyles",()=>b])},891924,a=>{"use strict";var b=a.i(962427);a.i(260448),a.i(815846),a.i(891677),a.i(24041),a.i(745071),a.i(322122),a.i(330268),a.i(670416),a.i(25910),a.i(216118),a.i(710456),a.i(518891);var c=a.i(696948),d={parser:b.classDiagram_default,get db(){return new b.ClassDB},renderer:b.classRenderer_v3_unified_default,styles:b.styles_default,init:(0,c.__name)(a=>{a.class||(a.class={}),a.class.arrowMarkerAbsolute=a.arrowMarkerAbsolute},"init")};a.s(["diagram",()=>d])}];

//# sourceMappingURL=931bf_mermaid_dist_chunks_mermaid_core_c5b1d4f9._.js.map