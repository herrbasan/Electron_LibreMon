/*!
 * CSSRulePlugin 3.2.6
 * https://greensock.com
 *
 * @license Copyright 2008-2020, GreenSock. All rights reserved.
 * Subject to the terms at https://greensock.com/standard-license or for
 * Club GreenSock members, the agreement issued with that membership.
 * @author: Jack Doyle, jack@greensock.com
*/
var gsap,_coreInitted,_win,_doc,CSSPlugin,_windowExists=function(){return"undefined"!=typeof window},_getGSAP=function(){return gsap||_windowExists()&&(gsap=window.gsap)&&gsap.registerPlugin&&gsap},_checkRegister=function(){return _coreInitted||_initCore(),_coreInitted},_initCore=function(e){gsap=e||_getGSAP(),_windowExists()&&(_win=window,_doc=document),gsap&&(CSSPlugin=gsap.plugins.css)&&(_coreInitted=1)};export var CSSRulePlugin={version:"3.2.6",name:"cssRule",init:function(e,t,i,n,s){if(!_checkRegister()||void 0===e.cssText)return!1;var r=e._gsProxy=e._gsProxy||_doc.createElement("div");this.ss=e,this.style=r.style,r.style.cssText=e.cssText,CSSPlugin.prototype.init.call(this,r,t,i,n,s)},render:function(e,t){for(var i,n=t._pt,s=t.style,r=t.ss;n;)n.r(e,n.d),n=n._next;for(i=s.length;--i>-1;)r[s[i]]=s[s[i]]},getRule:function(e){_checkRegister();var t,i,n,s,r=_doc.all?"rules":"cssRules",o=_doc.styleSheets,c=o.length,l=":"===e.charAt(0);for(e=(l?"":",")+e.split("::").join(":").toLowerCase()+",",l&&(s=[]);c--;){try{if(!(i=o[c][r]))continue;t=i.length}catch(e){continue}for(;--t>-1;)if((n=i[t]).selectorText&&-1!==(","+n.selectorText.split("::").join(":").toLowerCase()+",").indexOf(e)){if(!l)return n.style;s.push(n.style)}}return s},register:_initCore};_getGSAP()&&gsap.registerPlugin(CSSRulePlugin);export{CSSRulePlugin as default};