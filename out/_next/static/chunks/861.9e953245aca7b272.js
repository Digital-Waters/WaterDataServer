(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[861],{28861:function(e,t,n){"use strict";n.r(t),n.d(t,{default:function(){return L}});var r,o,a,u,c,l,i=n(57437),f=n(2265);let s=(0,f.createContext)(null),p=s.Provider;function d(){let e=(0,f.useContext)(s);if(null==e)throw Error("No context provided: useLeafletContext() can only be used in a descendant of <MapContainer>");return e}var g=n(77691);function m(){return(m=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e}).apply(this,arguments)}let h=(0,f.forwardRef)(function({bounds:e,boundsOptions:t,center:n,children:r,className:o,id:a,placeholder:u,style:c,whenReady:l,zoom:i,...s},d){let[h]=(0,f.useState)({className:o,id:a,style:c}),[y,w]=(0,f.useState)(null);(0,f.useImperativeHandle)(d,()=>y?.map??null,[y]);let v=(0,f.useCallback)(r=>{if(null!==r&&null===y){let o=new g.Map(r,s);null!=n&&null!=i?o.setView(n,i):null!=e&&o.fitBounds(e,t),null!=l&&o.whenReady(l),w(Object.freeze({__version:1,map:o}))}},[]);(0,f.useEffect)(()=>()=>{y?.map.remove()},[y]);let b=y?f.createElement(p,{value:y},r):u??null;return f.createElement("div",m({},h,{ref:v}),b)});var y=n(54887);function w(e,t,n){return Object.freeze({instance:e,context:t,container:n})}function v(e,t){return null==t?function(t,n){let r=(0,f.useRef)();return r.current||(r.current=e(t,n)),r}:function(n,r){let o=(0,f.useRef)();o.current||(o.current=e(n,r));let a=(0,f.useRef)(n),{instance:u}=o.current;return(0,f.useEffect)(function(){a.current!==n&&(t(u,n,a.current),a.current=n)},[u,n,r]),o}}function b(e,t){let n=(0,f.useRef)(t);(0,f.useEffect)(function(){t!==n.current&&null!=e.attributionControl&&(null!=n.current&&e.attributionControl.removeAttribution(n.current),null!=t&&e.attributionControl.addAttribution(t)),n.current=t},[e,t])}function E(e,t){let n=(0,f.useRef)();(0,f.useEffect)(function(){return null!=t&&e.instance.on(t),n.current=t,function(){null!=n.current&&e.instance.off(n.current),n.current=null}},[e,t])}function C(e,t){let n=e.pane??t.pane;return n?{...e,pane:n}:e}function O(e){return function(t){var n;let r=d(),o=e(C(t,r),r);return b(r.map,t.attribution),E(o.current,t.eventHandlers),n=o.current,(0,f.useEffect)(function(){return(r.layerContainer??r.map).addLayer(n.instance),function(){r.layerContainer?.removeLayer(n.instance),r.map.removeLayer(n.instance)}},[r,n]),o}}let x=(r=O(v(function({url:e,...t},n){return w(new g.TileLayer(e,C(t,n)),n)},function(e,t,n){!function(e,t,n){let{opacity:r,zIndex:o}=t;null!=r&&r!==n.opacity&&e.setOpacity(r),null!=o&&o!==n.zIndex&&e.setZIndex(o)}(e,t,n);let{url:r}=t;null!=r&&r!==n.url&&e.setUrl(r)})),(0,f.forwardRef)(function(e,t){let{instance:n}=r(e).current;return(0,f.useImperativeHandle)(t,()=>n),null})),S=(o=O(v(function({position:e,...t},n){var r;let o=new g.Marker(e,t);return w(o,(r={overlayContainer:o},Object.freeze({...n,...r})))},function(e,t,n){t.position!==n.position&&e.setLatLng(t.position),null!=t.icon&&t.icon!==n.icon&&e.setIcon(t.icon),null!=t.zIndexOffset&&t.zIndexOffset!==n.zIndexOffset&&e.setZIndexOffset(t.zIndexOffset),null!=t.opacity&&t.opacity!==n.opacity&&e.setOpacity(t.opacity),null!=e.dragging&&t.draggable!==n.draggable&&(!0===t.draggable?e.dragging.enable():e.dragging.disable())})),(0,f.forwardRef)(function(e,t){let{instance:n,context:r}=o(e).current;return(0,f.useImperativeHandle)(t,()=>n),null==e.children?null:f.createElement(p,{value:r},e.children)})),j=(a=function(e,t){return w(new g.Popup(e,t.overlayContainer),t)},u=function(e,t,{position:n},r){(0,f.useEffect)(function(){let{instance:o}=e;function a(e){e.popup===o&&(o.update(),r(!0))}function u(e){e.popup===o&&r(!1)}return t.map.on({popupopen:a,popupclose:u}),null==t.overlayContainer?(null!=n&&o.setLatLng(n),o.openOn(t.map)):t.overlayContainer.bindPopup(o),function(){t.map.off({popupopen:a,popupclose:u}),t.overlayContainer?.unbindPopup(),t.map.removeLayer(o)}},[e,t,r,n])},c=v(a),l=function(e,t){let n=d(),r=c(C(e,n),n);return b(n.map,e.attribution),E(r.current,e.eventHandlers),u(r.current,n,e,t),r},(0,f.forwardRef)(function(e,t){let[n,r]=(0,f.useState)(!1),{instance:o}=l(e,r).current;(0,f.useImperativeHandle)(t,()=>o),(0,f.useEffect)(function(){n&&o.update()},[o,n,e.children]);let a=o._contentNode;return a?(0,y.createPortal)(e.children,a):null}));n(60966);var z=e=>{let{coordinates:t,colors:n}=e,r=d().map,[o,a]=(0,f.useState)(null),u=(0,f.useRef)([]);return(0,f.useEffect)(()=>{if(r){let e=()=>a(r.getZoom());return r.on("zoomend",e),a(r.getZoom()),()=>{r.off("zoomend",e)}}},[r]),(0,f.useEffect)(()=>{if(r&&t.length>0&&null!==o){let e=o>15?10:o<=15&&o>10?5:1;u.current.forEach(e=>{r.removeLayer(e)}),u.current=[],t.forEach(t=>{let o;console.log("zoom: ",r.getZoom()),console.log("stroke: ",e);try{o=JSON.parse(t.nearbyGeoCoords)}catch(e){return}let a=[...o.map(e=>[e.lat,e.lng]),...o.slice().reverse().map(e=>[e.lat,e.lng])],c=n[t.deviceID];if("string"==typeof c)try{let e=c.replace(/'/g,'"').trim();c=JSON.parse(e)}catch(e){console.error("Error parsing color data:",c,e);return}if(c&&"object"==typeof c&&"r"in c&&"g"in c&&"b"in c&&"a"in c){let t=function(e){let t=e=>Math.round(e).toString(16).padStart(2,"0"),n=t(e.r),r=t(e.g),o=t(e.b),a=t(e.a/100*255);return"#".concat(n).concat(r).concat(o).concat(a)}(c),n=new g.Polygon(a,{color:t,weight:e,fillColor:t,fillOpacity:.4});n.addTo(r),u.current.push(n)}})}},[r,t,o,n]),(0,f.useEffect)(()=>()=>{u.current.forEach(e=>{r.removeLayer(e)}),u.current=[]},[r]),null};let I=new g.Icon({iconUrl:"/assets/pin.png",iconSize:[25,25],iconAnchor:[12,41],popupAnchor:[1,-34]});var L=function(){let[e,t]=(0,f.useState)([]),[n,r]=(0,f.useState)(null),[o,a]=(0,f.useState)([]),[u,c]=(0,f.useState)({}),l=new URLSearchParams(window.location.search).get("date"),s=new URLSearchParams(window.location.search).get("time");return(0,f.useEffect)(()=>{async function e(){try{let e=await fetch("https://water-watch-58265eebffd9.herokuapp.com/getwaterdevice/"),n=await e.json();console.log(n),t(n)}catch(e){console.error("Error loading polygon data:",e)}}o&&e()},[o]),(0,f.useEffect)(()=>{(async function(){if(l)try{let e=await fetch("".concat("https://water-watch-58265eebffd9.herokuapp.com/getwaterdata/","?only_underwater=25&begin_datetime=").concat(l+"T00:00:00-05:00","&end_datetime=").concat(l+"T23:59:59-05:00")),t=(await e.json()).reduce((e,t)=>{let{deviceID:n}=t;return e[n]||(e[n]=[]),e[n].push(t),e},{});r(t)}catch(e){console.error("Error fetching data:",e)}})()},[l]),(0,f.useEffect)(()=>{n&&a(Array.from(new Set(Object.keys(n))))},[n]),(0,f.useEffect)(()=>{if(l&&s&&n){let e={},t=new Date("".concat(l,"T").concat(s)),r=new Date(t.getTime()-6e5);Object.keys(n).forEach(o=>{let a=n[o].find(e=>{let n=new Date(e.device_datetime);return n>=r&&n<=t&&function(e){try{let t=JSON.parse(e.replace(/'/g,'"'));return["r","g","b","a"].every(e=>e in t&&!isNaN(t[e]))}catch(e){return!1}}(e.waterColor)});a?e[o]=a.waterColor:e[o]="{'r': 0, 'g': 0, 'b': 0, 'a': 0}"}),c(e)}},[l,s,n]),(0,i.jsxs)(h,{center:[43.687104,-79.39095966666666],zoom:12,className:"h-4/5 w-3/4",children:[(0,i.jsx)(x,{url:"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}),n&&Object.keys(n).map(e=>n[e].map((t,n)=>{let r=parseFloat(t.latitude),o=parseFloat(t.longitude),a=t.device_datetime;return 999!==r&&999!==o?(0,i.jsx)(S,{position:[r,o],icon:I,children:(0,i.jsx)(j,{children:a})},"".concat(e,"-").concat(n)):null})),(0,i.jsx)(z,{coordinates:e,colors:u})]})}},60966:function(){}}]);