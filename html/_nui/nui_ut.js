'use strict';


let ut = {}
ut.version = [3, 0, 0];
ut.version_date = [2023, 3, 23];
if(window) { window.ut = ut; }
// 3.0 Stripped down to the really useful stuff


let isWorker = false; try{(Element);} catch(err) { isWorker = true; }

if(!isWorker){
	if(!Element.prototype.el) { Element.prototype.el = function(s) { return ut.el(s, this); }}
	if(!Element.prototype.els) { Element.prototype.els = function(s) { return ut.els(s, this); }}
	if(!Element.prototype.html) { Element.prototype.html = function(s) { ut.html(this, s); }}
	if(!Element.prototype.css) { Element.prototype.css = function(s, remove) { ut.css(this, s, remove); }}
	if(!Element.prototype.hasClass) { Element.prototype.hasClass = function(s) { return ut.hasClass(this, s); }}
	if(!Element.prototype.addClass) { Element.prototype.addClass = function(s) { ut.addClasses(this, s); }}
	if(!Element.prototype.removeClass) { Element.prototype.removeClass = function(s) { ut.removeClass(this, s); }}
	if(!Element.prototype.toggleClass) { Element.prototype.toggleClass = function(s) { ut.toggleClass(this, s); }}
}

if(!Array.prototype.sortByKey) { Array.prototype.sortByKey = function(path) { ut.sortByKey(this, path); }}
if(!Array.prototype.includesDeep) { Array.prototype.includesDeep = function(path, compare) { return ut.includesDeep(this, path, compare); }}


// -----------------------------------------------------------------------------------------------
// Hack to optimize nexted props
ut.sortByKey = function (array, path, numeric=false) {
	let split = path.split('.');
	let compare =  [ 
		function(a, b) {
			var x = a[path]; var y = b[path];
			if (typeof x == "string") { x = x.toLowerCase(); y = y.toLowerCase(); }
			if(numeric){ return x - y; }
			else { return ((x < y) ? -1 : ((x > y) ? 1 : 0)); }
		},
		function(a, b) {
			var x = a[split[0]][split[1]]; var y = b[split[0]][split[1]];
			if (typeof x == "string") { x = x.toLowerCase(); y = y.toLowerCase(); }
			if(numeric){ return x - y; }
			else { return ((x < y) ? -1 : ((x > y) ? 1 : 0)); }
		},
		function(a, b) {
			var x = a[split[0]][split[1]][split[2]]; var y = b[split[0]][split[1]][split[2]];
			if (typeof x == "string") { x = x.toLowerCase(); y = y.toLowerCase(); }
			if(numeric){ return x - y; }
			else { return ((x < y) ? -1 : ((x > y) ? 1 : 0)); }
		},
		function(a, b) {
			var x = a[split[0]][split[1]][split[2]]; var y = b[split[0]][split[1]][split[2]];
			if (typeof x == "string") { x = x.toLowerCase(); y = y.toLowerCase(); }
			if(numeric){ return x - y; }
			else { return ((x < y) ? -1 : ((x > y) ? 1 : 0)); }
		},
		function(a, b) {
			var x = a[split[0]][split[1]][split[2]][split[3]]; var y = b[split[0]][split[1]][split[2]][split[3]];
			if (typeof x == "string") { x = x.toLowerCase(); y = y.toLowerCase(); }
			if(numeric){ return x - y; }
			else { return ((x < y) ? -1 : ((x > y) ? 1 : 0)); }
		}
	];
	return array.sort(compare[split.length-1])
}


ut.indexByProp = function(ar, prop, value){
	return ar.map(e => ut.deep_get(e, prop)).indexOf(value);
}

ut.itemByProp = function(ar, prop, value){
	let idx = ar.map(e => ut.deep_get(e, prop)).indexOf(value);
	return ar[idx];
}

ut.allIdxByProp = function(ar, prop, value) {
    let idxs = [];
    for(let i=0; i<ar.length; i++){
        if (ut.deep_get(ar[i], prop) === value){
            idxs.push(i);
		}
	}
    return idxs;
}

ut.deep_get = function(obj, path){
	let split = path.split('.');
	if(split.length == 1) { return obj[path] ;}
	if(split.length == 2) { return obj[split[0]][split[1]] ;}
	if(split.length == 3) { return obj[split[0]][split[1]][split[2]] ;}
	if(split.length == 4) { return obj[split[0]][split[1]][split[2]][split[3]] ;}
	if(split.length == 5) { return obj[split[0]][split[1]][split[2]][split[3]][split[4]] ;}
	if(split.length == 6) { return obj[split[0]][split[1]][split[2]][split[3]][split[4]][split[5]] ;}
	if(split.length == 7) { return obj[split[0]][split[1]][split[2]][split[3]][split[4]][split[5]][split[6]] ;}
	if(split.length == 8) { return obj[split[0]][split[1]][split[2]][split[3]][split[4]][split[5]][split[6]][split[7]] ;}
	if(split.length == 9) { return obj[split[0]][split[1]][split[2]][split[3]][split[4]][split[5]][split[6]][split[7]][split[8]] ;}
	if(split.length > 9){
		let oobj = obj;
		for (var i=0; i<split.length; i++){
			oobj = oobj[split[i]];
		};
		return oobj;
	}
}

ut.deep_set = function (obj, path, value) {
	let split = path.split('.');
    let last = split.pop();
    for (let i=0; i < split.length; i++){
        obj = obj[split[i]];
	}
    obj[last] = value;
}


ut.deep_includes = function (ar, path, compare){
	let found = 0;
	for(let i=0; i<ar.length; i++){
		if(ut.deep_get(ar[i], path) === compare){
			found++;
		}
	}
	return (found > 0);
}

ut.keyByValue = function(obj, val){
	let found;
	for(let key in obj){
		if(obj[key] == val){
			return found = key;
		}
	}
}

ut.keyByDeepValue = function(obj, path, val){
	let found = {};
	for(let key in obj){
		if(ut.deep_get(obj[key], path) === val){
			found = key;
		}
	}
	return found;
}

ut.jclone = function(obj){ return JSON.parse(JSON.stringify(obj)) }
ut.clone = function(obj) {
	if(!structuredClone) { return ut.jclone(obj); }
	return structuredClone(obj);
}

ut.jcompare = function(obj_1, obj_2){
	let is = true;
	let a = JSON.stringify(obj_1);
	let b = JSON.stringify(obj_2);
	if(a === b){
		is = false;
	}
	return is;
}

/*Experimental*/
ut.fetch = async function(resource, options = {}) {
	const { timeout = 8000 } = options;
	const controller = new AbortController();
	const id = setTimeout(() => controller.abort(), timeout);
	const response = await fetch(resource, {
	  ...options,
	  signal: controller.signal  
	});
	clearTimeout(id);
	return response;
}

/**
 * 
 * @param {string} url 
 * @param {object} data 		* params to send
 * @param {object} _options 	* request options
 * @returns {object}
 */
ut.jfetch = function(url, data, _options){
	return new Promise(async (resolve, reject) => {
		let options = _options ? _options : { credentials: 'same-origin', method: 'POST'}
		if(options.timeout){
			options.controller = new AbortController();
			options.signal = options.controller.signal;
			options.timeout_id = setTimeout(() => options.controller.abort(), options.timeout);
		}
		let formData = new FormData();
		for(let key in data){
			formData.append(key, data[key]);
		}
		options.body = formData;
		fetch(url, options)
		.then((response) => {
			clearTimeout(options.timeout_id);
			if(response.ok){
				return response.json()
			}
			else {
				throw new Error('Connection Refused');
			}
		})
		.then((result) => {
			resolve(result);
		})
		.catch((err) => {
			clearTimeout(options.timeout_id);
			resolve({error:err.toString()})
		})

		
	})
}

ut.jget = function(url, data, _options){
	return new Promise((resolve, reject) => {
		let options = _options ? _options : { credentials: 'same-origin', method: 'GET'}
		//let controller = new AbortController();
		//let request_timeout = setTimeout(() => { console.log('fetch request timout'); controller.abort()}, options.timeout || 10000)
		let vars = '?';
		for(let key in data){
			vars += key + '=' + data[key] + '&';
		}
		if(vars == '?') { vars = ''}
		fetch(url + vars, options)
		.then((response) => {
			//clearTimeout(request_timeout);
			if(response.ok){
				return response.json()
			}
			else {
				throw new Error('Connection Refused');
			}
		})
		.then((result) => {
			resolve(result);
		})
		.catch(reject);
	})
}

ut.jDownload = function(url, data, _options){
	return new Promise((resolve, reject) => {
		let options = _options ? _options : { credentials: 'same-origin', method: 'POST'}
		let formData = new FormData();
		for(let key in data){
			formData.append(key, data[key]);
		}
		options.body = formData;
		fetch(url, options)
		.then( res => res.blob() )
		.then( blob => {
			var file = window.URL.createObjectURL(blob);
			window.location.assign(file);
		})
		.catch(reject);
	})
}

ut.jString = function (str) { let out = str; try { out = JSON.parse(str); } finally { return out; } }

ut.readJson = function (url){
    return new Promise( async (resolve, reject) => {
        let json = {};
        let res = await fetch(url);
        if(!res.ok) { resolve({error:'invalid url'}); return;}
        
        try {
            json = await res.json();
        }
        catch(err) {
            json = {error:err.toString()}
        }
        resolve(json);
    })
}

ut.formatDate = function (n) {
	let out = {};
	let date = new Date(n);
	out.keys = {
		year:date.getFullYear(), 
		month:ut.lz(date.getMonth() + 1), 
		day:ut.lz(date.getDate()), 
		hour:ut.lz(date.getHours()),
		minutes:ut.lz(date.getMinutes()),
		seconds:ut.lz(date.getSeconds()),
		milliseconds:ut.lz(date.getMilliseconds(), 3)
	}
	
	out.time = out.keys.hour + ':' + out.keys.minutes + ':' + out.keys.seconds;
	out.date = out.keys.day + '.' + out.keys.month + '.' + out.keys.year;
	out.date_input = +  out.keys.year + '-' + out.keys.month + '-' + out.keys.day;
 	out.full = out.date + ' - ' + out.time;
	out.file = out.date + ' - ' + out.keys.hour + ':' + out.keys.minutes;
	out.log = out.date + ' - ' + out.time + ':' + out.keys.milliseconds;
	/*
	out.time = ut.lz(date.getHours()) + ':' + ut.lz(date.getMinutes()) + ':' + ut.lz(date.getSeconds());
	out.date = ut.lz(date.getDate()) + '.' + ut.lz(date.getMonth() + 1) + '.' + date.getFullYear();
	out.date_input = + date.getFullYear() + '-' + ut.lz(date.getMonth() + 1) + '-' + ut.lz(date.getDate());
 	out.full = out.date + ' - ' + out.time;
	out.file = out.date + ' - ' + ut.lz(date.getHours()) + ':' + ut.lz(date.getMinutes());
	out.log = out.date + ' - ' + out.time + ':' + ut.lz(date.getMilliseconds(), 3); */
	return out;
}

// -----------------------------------------------------------------------------------------------

ut.playTime = function (n = 0, fps = 30) {
	let obj = {};
	obj.isNegative = n < 0;
	n = n < 0 ? Math.abs(n) : n;

	let h = (1000 * 60 * 60);
	let m = (1000 * 60);
	let s = 1000;
	obj["hours"] = ut.lz(Math.floor(n / h), 2);
	obj["minutes"] = ut.lz(Math.floor(n % h / m), 2);
	obj["full_minutes"] = Math.floor(n / m);
	obj["seconds"] = ut.lz(Math.floor(n % h % m / s), 2);
	obj["milliseconds"] = ut.lz(Math.floor(n % h % m % s), 3);
	obj["frames"] = ut.lz(Math.round((n * fps) % fps), 2);

	obj["minsec"] = obj.full_minutes + ":" + obj.seconds;
	obj["short"] = obj.hours + ":" + obj.minutes + ":" + obj.seconds;
	obj["full"] = obj.hours + ":" + obj.minutes + ":" + obj.seconds + ":" + obj.milliseconds;
	obj["frames"] = obj.hours + ":" + obj.minutes + ":" + obj.seconds + ":" + obj.frames;
	return obj;
}

// -----------------------------------------------------------------------------------------------

ut.formatFileSize = function (n) {
	let size = '';
	if (n > 1024 * 1024 * 1024 * 1024) {
		size = (n / 1024 / 1024 / 1024 / 1024).toFixed(2) + ' TB';
	}
	else if (n > 1024 * 1024 * 1024) {
		size = (n / 1024 / 1024 / 1024).toFixed(2) + ' GB';
	}
	else if (n > 1024 * 1024) {
		size = (n / 1024 / 1024).toFixed(2) + ' MB';
	}
	else if (n > 1024) {
		size = (n / 1024).toFixed(2) + ' KB';
	}
	else if (n < 1025) {
		size = n;
		if (n <= 0 || n == 'undefined') {
			size = '';
		}
	}
	return size;
}

ut.convertFahrenheitToCelsius = function (t) {
	return (5 / 9) * (t - 32);
  }
  
  ut.convertCelsiusToFahrenheit = function(t) {
	return t * (9/5) + 32;
  }

// -----------------------------------------------------------------------------------------------

ut.id = function () {
	return '_' + (
		Number(String(Math.random()).slice(2)) +
		Date.now() +
		Math.round(performance.now())
	).toString(36);
}

ut.getExtension = function (filename) {
	let parts = filename.split('.');
	return parts.pop();
}

ut.removeExtension = function(filename){
	let parts = filename.split('.')
	let ext = parts.pop();
	return parts.join('.');
}

ut.urlGetLast = function(url, sep='/'){
	let ar = url.split(sep);
	return ar[ar.length-1];
}

ut.isFileType = function (filename, types) {
	let ext = ut.getExtension(filename).toLowerCase();
	let out = false;
	types.forEach(function (type) {
		if (type.split('*.')[1] != undefined) {
			type = type.split('*.')[1];
		}
		if (ext == type) {
			out = true;
		}
	})
	return out;
}

ut.getMediaType = function(url){
	let type = 'unknown';
	let file = ut.urlGetLast(url);
	if(ut.isFileType(file, ['png','apng', 'webp','jpg','jpeg','jfif','pjpeg','pjp','avif','gif','svg','bmp','ico','cur','tif','tiff'])) { type = 'img' }
	else if(ut.isFileType(file, ['mp4','mkv','av1','webm','oga','mpg','mpeg','mov'])) { type = 'video' }
	else if(ut.isFileType(file, ['mp3','m4a','aac','flac','ogg','wav','aif', 'aiff'])) { type = 'audio' }
	return type;
}


ut.lzold = function (num, size = 2) {
	let s = num + "";
	while (s.length < size) s = "0" + s;
	return s;
}

ut.lz = function (num, size = 2) {
	return num.toString().padStart(size, '0');;
}

ut.capitalize = function (str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

ut.randomInt = function(max) {
	return Math.floor(Math.random()*max);
}

// -----------------------------------------------------------------------------------------------

ut.killKids = function (_el) {
	_el = ut.el(_el);
	while (_el?.firstChild) {
		_el.removeChild(_el.firstChild);
	}
}

ut.killMe = function (_el) {
	_el = ut.el(_el);
	if(_el?.parentNode){
		_el.parentNode.removeChild(_el);
	}
}

// -----------------------------------------------------------------------------------------------

ut.visibility = function(cb){
	let visibilityChange;
	let hidden;
	let isHidden = false;

	if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support 
		hidden = "hidden";
		visibilityChange = "visibilitychange";
	} else if (typeof document.msHidden !== "undefined") {
		hidden = "msHidden";
		visibilityChange = "msvisibilitychange";
	} else if (typeof document.webkitHidden !== "undefined") {
		hidden = "webkitHidden";
		visibilityChange = "webkitvisibilitychange";
	}

	function handleVisibilityChange(e) {
		if (document[hidden]) {
			isHidden = true;
		} else {
			isHidden = false;
		}
		cb(isHidden);
	}

	document.addEventListener(visibilityChange, handleVisibilityChange, false);
}

// -----------------------------------------------------------------------------------------------

ut.toggleFullscreen = (el) => {
    if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement) {
		ut.exitFullscreen();
		el.nui_isFullscreen = false;
	}
	else {
		ut.enterFullscreen(el);
		el.nui_isFullscreen = true;
	}
}

ut.enterFullscreen = function (el) {
	if (el.requestFullscreen) {
		el.requestFullscreen();
		return true;
	} else if (el.mozRequestFullScreen) {
		el.mozRequestFullScreen();
		return true;
	} else if (el.webkitRequestFullscreen) {
		el.webkitRequestFullscreen();
		return true;
	}
	return false;
}

ut.exitFullscreen = function () {
	if (document.exitFullscreen) {
		document.exitFullscreen();
	} else if (document.mozCancelFullScreen) {
		document.mozCancelFullScreen();
	} else if (document.webkitExitFullscreen) {
		document.webkitExitFullscreen();
	}
}


// Selector Helper
// -----------------------------------------------------------------------------------------------

ut.el = function (s, context=document) {
	if (s instanceof Element) { return s; } else { return context.querySelector(s); }
}

ut.els = function (s, context=document) {
	return context.querySelectorAll(s);;
}

ut.css = function (q, cs, remove=false) {
	let el = ut.el(q);
	for (let key in cs) {
		if(remove){
			el.style[key] = null;
		}
		else {
			//ut.el(q).style[key] = cs[key];
			el.style.setProperty(key, cs[key]);
		}
	}
}

ut.addClasses = function (_el, _classNames) {
	let classNames = _classNames;
	if (!(_classNames instanceof Array)) {
		classNames = _classNames.split(' ');
	}
	for (let i = 0; i < classNames.length; i++) {
		ut.addClass(_el, classNames[i]);
	}
}

ut.addClass = function (_el, _classNames) {
	let el = ut.el(_el);
	let classNames = _classNames;
	if (typeof _classNames != 'array') {
		classNames = _classNames.split(' ');
	}
	for (let i = 0; i < classNames.length; i++) {
		if (el.classList)
			el.classList.add(classNames[i])
		else if (!ut.hasClass(el, classNames[i])) el.className += " " + classNames[i]
	}
}

ut.removeClass = function (_el, _classNames) {
	let el = ut.el(_el);
	let classNames = _classNames;
	if (typeof _classNames != 'array') {
		classNames = _classNames.split(' ');
	}
	for (let i = 0; i < classNames.length; i++) {
		if (el.classList)
			el.classList.remove(classNames[i])
		else if (ut.hasClass(el, classNames[i])) {
			var reg = new RegExp('(\\s|^)' + classNames[i] + '(\\s|$)')
			el.className = el.className.replace(reg, ' ')
		}
	}
}

ut.toggleClass = function(_el, _className){
	let el = ut.el(_el);
	if (el.classList){
		el.classList.toggle(_className);
	}
	else {
		if(ut.hasClass(el, className)){
			ut.removeClass(el, className);
		}
		else {
			ut.addClass(el, className);
		}
	}
}

ut.hasClass = function (_el, className) {
	let el = ut.el(_el);
	if (el.classList)
		return el.classList.contains(className)
	else
		return !!el.className.match(new RegExp('(\\s|^)' + className + '(\\s|$)'))
}

ut.show = function(_el){ let el = ut.el(_el); el.style.display = null; }
ut.hide = function(_el){ let el = ut.el(_el); el.style.display = 'none'; }


// -----------------------------------------------------------------------------------------------
// Experimental
ut.addEvents = function(_el, events){
	let el = ut.el(_el);
	if(!el.nuiEvents){ el.nuiEvents = []}
	for(let key in events){
		el.addEventListener(key, events[key])
		el.nuiEvents.push({name:key, fnc:events[key]})
	}
}

ut.clearEvents = function(_el){
	let el = ut.el(_el);
	if(!el.nuiEvents) { return;}
	for(let i=0; i<el.nuiEvents.length; i++){
		el.removeEventListener(el.nuiEvents[i].name, el.nuiEvents[i].fnc);
	}
}

/**
 * @description Creates an HTML Element 
 * @param {string} type Element Type like div | span | img | etc
 * @param {Object} options Options
 * @param {Element} options.target Target : Element
 * @param {string} options.id ID Attribute : String
 * @param {string} options.class Class or Classes : String or Object
 * @param {string} options.style Inline Styles : String or Object
 * @param {string} options.inner InnerHTML : String or Element
 * @param {Object} options.attributes Attributes : Object 
 * @param {Object} options.dataset Dataset : Object
 * @param {Object} options.events Events : Object * Key is event type, value the callback fnc
 * @returns  {Element} Returns HTML Element
 */
ut.createElement = function (type, options){
	let el = document.createElement(type);
	if(options){
		if(options.id) { el.id = options.id }
		if(options.classes) { ut.addClass(el, options.classes) };
		if(options.class) { ut.addClass(el, options.class) };
		if(options.style) { ut.css(el, options.style)};
		if(options.events) { ut.addEvents(el, options.events )};
		if(options.inner) { 
			if(options.inner instanceof Element){
				el.appendChild(options.inner);
			}
			else {
				el.innerHTML = options.inner;
			}
		}
		if(options.target) { options.target.appendChild(el); }
		if(options.attributes) { ut.attributes(el, options.attributes)}
		if(options.dataset) {
			for(let key in options.dataset){
				el.dataset[key] = options.dataset[key];
			}
		}
	}
	return el; 
}

ut.attributes = function(_el, attributes){
	let el = ut.el(_el);
	for(let key in attributes){
		el.setAttribute(key, attributes[key]);
	}
}

ut.htmlObject = function(s){
	let hdoc = document.createRange().createContextualFragment(s);
	if(hdoc.children.length > 1){ hdoc = document.createRange().createContextualFragment('<div>' + s +'</div>'); }
	return hdoc.firstElementChild;
}

// Donno is this is useful
ut.offset = function(_el){
	let el = ut.el(_el);
	var rect = el.getBoundingClientRect(),
    scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
    scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return { top: rect.top + scrollTop, left: rect.left + scrollLeft }
}
// -----------------------------------------------------------------------------------------------

ut.calcScale = function (originalWidth, originalHeight, targetWidth, targetHeight, scaleMode, isCenter) {
	var rw = 0;
	var rh = 0;
	var rx = 0;
	var ry = 0;

	if (scaleMode == 'fit' || scaleMode == 'contain') {
		if (targetWidth / targetHeight < originalWidth / originalHeight) {
			rw = targetWidth;
			rh = Math.round(originalHeight * (targetWidth / originalWidth));
		}
		else {
			rh = targetHeight;
			rw = Math.round(originalWidth * (targetHeight / originalHeight));
		}
	}

	if (scaleMode == 'full' || scaleMode == 'cover') {
		if (targetWidth / targetHeight < originalWidth / originalHeight) {
			rh = targetHeight;
			rw = Math.round(originalWidth * (targetHeight / originalHeight));
		}
		else {
			rw = targetWidth;
			rh = Math.round(originalHeight * (targetWidth / originalWidth));
		}
	}

	if (scaleMode == 'fill') {
		rh = targetHeight;
		rw = targetWidth;
	}
	if (isCenter) {
		rx = Math.round(targetWidth / 2 - rw / 2);
		ry = Math.round(targetHeight / 2 - rh / 2);
	}
	return {scaleX:rw/originalWidth, scaleY:rh/originalHeight, rect:[rx, ry, rw, rh]}
}


ut.hitObject = function(obj, x, y){
	let bounds = obj.getBoundingClientRect();
	let ar = [bounds.left, bounds.top, bounds.width, bounds.height];
	return ut.hitRect(ar, x, y)
}

ut.hitRect = function(ar, x, y){
	let hit = false;
	if((x > ar[0] && x < (ar[0] + ar[2])) && (y > ar[1] && y < (ar[1] + ar[3]))){
		hit = true;
	}
	return hit;
}


// -----------------------------------------------------------------------------------------------

ut.getImage = function(fp, cb){
	let image = new Image();
	image.src = fp;
	if(!cb){
		return new Promise((resolve, reject) => {
			image.addEventListener('load', (img) => {
				resolve(image);
			})
		})
	}
	
	image.addEventListener('load', (img) => {
		cb(image);
	})
}




// -----------------------------------------------------------------------------------------------

ut.isNode = function(o){
	return (
    	typeof Node === "object" ? o instanceof Node : 
    	o && typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName==="string"
  	);
}

  
ut.isElement = function(o){
  return (
    	typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
    	o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string"
	);
}



ut.getComputedTranslateXY = function(obj) {
	const transArr = [];
    if(!window.getComputedStyle) return;
    const style = getComputedStyle(obj),
        transform = style.transform || style.webkitTransform || style.mozTransform;
    let mat = transform.match(/^matrix3d\((.+)\)$/);    
    if(mat) return parseFloat(mat[1].split(', ')[13]);
    mat = transform.match(/^matrix\((.+)\)$/);
    mat ? transArr.push(parseFloat(mat[1].split(', ')[4])) : transArr.push(0);
    mat ? transArr.push(parseFloat(mat[1].split(', ')[5])) : transArr.push(0);
    return transArr;
}

ut.locationHash = function(hash_string){
	let out = {};
	if(!hash_string){
		hash_string = window.location.hash;
	}
	if(hash_string.includes('#')){
		let hash = hash_string.split('#')[1].split('&');
		hash.forEach(item => { 
			let temp = item.split('=');
			if(temp[0]){
				out[temp[0]] = temp[1];
			}
		})
	}
	return out;
}

ut.locationSearch = function(search_string){
	let out = {};
	if(!search_string){
		search_string = window.location.search;
	}
	if(search_string.includes('?')){
		let search = search_string.split('?')[1].split('&');
		search.forEach(item => { 
			let temp = item.split('=');
			if(temp[0]){
				out[temp[0]] = temp[1];
			}
		})
	}
	return out;
}


// -----------------------------------------------------------------------------------------------

ut.average = function(ar){
	return (ar.reduce((a,b) => { return a+b }, 0))/ar.length;
}

ut.medianAverage = function(ring){
	let sum = 0;
	if(ring.length > 3) {
		let ar = [...ring];
		ar.sort(function(a,b) { return a - b;});
		ar = ar.slice(1,ar.length-1);
		sum = ar.reduce(function(a, b) { return a + b}) / ar.length;
	}
	return sum;
}

ut.awaitMs = function(ms){
	return new Promise((resolve, reject) => {
		setTimeout(resolve, ms)
	})
}

ut.awaitEvent = function(el, event, time=100000){
	return new Promise((resolve, reject) => {
		el.addEventListener(event, done);
		let to = setTimeout(done, time);
		function done(e){
			clearTimeout(to);
			el.removeEventListener(event, done);
			if(!e){ resolve('timeout') }
			else { resolve(e); }
		}
	})
}


ut.shuffleArray = function(ar, clone=false){
	let array;
	if(clone){ array = ar.slice(); } else { array = ar; }
	for (let i = array.length - 1; i > 0; i--) {
    	const j = Math.floor(Math.random() * (i + 1));
    	const temp = array[i];
    	array[i] = array[j];
    	array[j] = temp;
  	}
	return array;
}

ut.filter = (param) => {
	let filterd = [];
	let data = param.data;
	let search = param.search;
	let prop = param.prop;
	for(let i=0; i<data.length; i++){
		let fields = [];
		for(let n=0; n<prop.length; n++){
			fields.push(ut.deep_get(data[i], prop[n]))
		}
		let sr = searchAny(search, fields);
		if(sr){
			if(param.return_index_only){
				filterd.push(i);
			}
			else {
				filterd.push(data[i]);
			}
		}
	}
	return filterd;
	
	
	function searchAny(search, ar){
		for(let i=0; i<ar.length; i++){
			let t = String(ar[i]);
			if(param.ignore_case){
				t = t.toLowerCase();
				search = search.toLowerCase();
			}
			if(t.includes(search)){
				return true;
			}
		}
		return false;
	}
}

ut.arrayToObject = function(ar, key){
	let obj = {};
	ar.forEach(item => { 
		let tkey = ut.deep_get(item, key);
		if(obj[tkey]){ console.warn('the Key: ' + tkey + ' allready exsists, values will be overwritten.'); }
		obj[tkey] = item; 
	})
	return obj;
}


ut.animate = function(t, animation, cb, bypass){
	if(!bypass){
		if(cb){ cb(t) }
		return;
	}
	t.addEventListener('animationend', post);
	function post(e){
		t.removeEventListener('animationend', post);
		t.classList.remove(animation)
		if(cb){ cb(t) }
	}
	t.classList.add(animation);
}

ut.animate_away = function(t, ani='ani-fade-out'){
	nui.animate(t, ani, () => {
		t.parentNode.removeChild(t);
	})
}

ut.headImport = function(options){
	if(Array.isArray(options)){
		let promises = [];
		for(let i=0; i<options.length; i++){
			promises.push(ut.headImport(options[i]))
		}
		return Promise.allSettled(promises);
	}
	return addHeadImport(options);
}

function addHeadImport(options){
	return new Promise((resolve, reject) => {
		let link;
		if(options.type === 'js') { link = document.createElement('script'); link.type = 'text/javascript'; }
		if(options.type === 'esm') { document.createElement('script'); link.type = 'module'; }
		if(options.type === 'css') { 
			link = document.createElement('link');
			link.type = "text/css";
			link.rel = 'stylesheet';
		}
		link.href = options.url;
		link.src = options.url;
		link.addEventListener('error', (e) => { console.log(e)})
		link.addEventListener('load', resolve, {once:true});
		document.getElementsByTagName('head')[0].appendChild(link);
	})
}

ut.getCssVars = function(el = document.styleSheets) {
    let out = {};
    let names = getCssVarNames(el);
    for (let i = 0; i < names.length; i++) {
        out[names[i]] = ut.getCssVar(names[i]);
    }
    return out;
}

ut.getCssVar = function(prop, el) {
    if (!el) { el = document.body }
    let s = getComputedStyle(el).getPropertyValue(prop).trim();
    let unit = false;
    let value = s;
    let computed = false;
    let absolute_units = ['cm', 'mm', 'Q', 'in', 'pc', 'pt', 'px'];
    let relative_units = ['%', 'rem', 'em', 'ex', 'ch', 'lh', 'rlh', 'svw', 'svh', 'dvw', 'dvh', 'lvw', 'lvh', 'vw', 'vh', 'vmin', 'vmax', 'vb', 'vi'];
    let isAbsolute = false;

    if (!isNaN(s)) { return { value: Number(s), unit: 'number', absolute: true, computed: Number(s) } }

    for (let i = 0; i < absolute_units.length; i++) {
        let item = absolute_units[i];
        if (s.substr(s.length - item.length, item.length) == item && !s.includes('vmin')) {
            let t = Number(s.substr(0, s.length - item.length));
            if (!isNaN(t)) {
                value = t;
                computed = value;
                unit = item;
                isAbsolute = true;
                break;
            }
        }
    }
    if (!isAbsolute) {
        for (let i = 0; i < relative_units.length; i++) {
            let item = relative_units[i];
            if (s.substr(s.length - item.length, item.length) == item) {
                value = Number(s.substr(0, s.length - item.length));
                unit = item;
                if (item == 'em' || item == 'rem') {
                    let base = ut.getCssVar('font-size', el).value;
                    computed = Math.round(value * base);
                }
                else if (item == 'vw' || item == '%') {
                    value = value / 100;
                    computed = Math.round(value * window.innerWidth);
                }
                else if (item == 'vh') {
                    value = value / 100;
                    computed = Math.round(value * window.innerHeight);
                }
                else if (item == 'vmin' || item == 'vmax') {
                    value = value / 100;
                    let side = window.innerWidth;
                    if (window.innerHeight > window.innerWidth) {
                        side = window.innerHeight;
                    }
                    computed = Math.round(value * side);
                }
                break;
            }
        }
    }
    if (!unit) {
        let c = parseCSSColor(s);
        if (c) {
            unit = 'rgba';
            isAbsolute = true;
            computed = c;
        }
    }
    return { value: value, unit: unit, absolute: isAbsolute, computed: computed };
}

ut.setCssVar = function(s, val) {
    document.documentElement.style.setProperty(s, val);
}

ut.cssColorString = function(ar) {
    if (ar.length > 3) {
        return `rgba(${ar[0]},${ar[1]},${ar[2]},${ar[3]})`
    }
    return `rgb(${ar[0]},${ar[1]},${ar[2]})`
}

function getCssVarNames(el = document.styleSheets) {
    var cssVars = [];
    for (var i = 0; i < el.length; i++) {
        try {
            for (var j = 0; j < el[i].cssRules.length; j++) {
                try {
                    for (var k = 0; k < el[i].cssRules[j].style.length; k++) {
                        let name = el[i].cssRules[j].style[k];
                        if (name.startsWith('--') && cssVars.indexOf(name) == -1) {
                            cssVars.push(name);
                        }
                    }
                } catch (error) { }
            }
        } catch (error) { }
    }
    return cssVars;
}

function parseCSSColor(color) {
    var cache,
        p = parseInt,
        color = color.replace(/\s/g, '');
    if (cache = /#([\da-fA-F]{2})([\da-fA-F]{2})([\da-fA-F]{2})/.exec(color))
        cache = [p(cache[1], 16), p(cache[2], 16), p(cache[3], 16)];
    else if (cache = /#([\da-fA-F])([\da-fA-F])([\da-fA-F])/.exec(color))
        cache = [p(cache[1], 16) * 17, p(cache[2], 16) * 17, p(cache[3], 16) * 17];
    else if (cache = /rgba\(([\d]+),([\d]+),([\d]+),([\d]+|[\d]*.[\d]+)\)/.exec(color))
        cache = [+cache[1], +cache[2], +cache[3], +cache[4]];
    else if (cache = /rgb\(([\d]+),([\d]+),([\d]+)\)/.exec(color))
        cache = [+cache[1], +cache[2], +cache[3]];
    else return false;

    isNaN(cache[3]) && (cache[3] = 1);
    return cache;
}

ut.getCookies = function(){
	var pairs = document.cookie.split(";");
	var cookies = {};
	for (var i=0; i<pairs.length; i++){
		var pair = pairs[i].split("=");
		cookies[(pair[0]+'').trim()] = decodeURI(pair.slice(1).join('='));
	}
	return cookies;
}

ut.setCookie = function(name, value, hours, path=''){
	let d = new Date();
	d.setTime(d.getTime() + (hours*60*60*1000));
	let expires = "expires="+ d.toUTCString();
	document.cookie = name + "=" + value + ";" + expires + `;path=/${path}`;
}

ut.getCookie = function(cname) {
 let name = cname + "=";
 let decodedCookie = decodeURIComponent(document.cookie);
 let ca = decodedCookie.split(';');
 for(let i = 0; i <ca.length; i++) {
   let c = ca[i];
   while (c.charAt(0) == ' ') {
	 c = c.substring(1);
   }
   if (c.indexOf(name) == 0) {
	 return c.substring(name.length, c.length);
   }
 }
 return "";
}

ut.deleteCookie = function(cname, path=''){
   document.cookie = `${cname}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/${path};`;
}

ut.checkCookie = function(cname, value) {
   let check = false;
   let cookie = ut.getCookie(cname);
   if( cookie != ""){
	   if(value){
		   if(cookie == value){
			   check = true;
		   }
	   }
	   else {
		   check = true;
	   }
   }
   return check; 
}

ut.icon_shapes = {
	add:'<path d="M0 0h24v24H0z" fill="none"/><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>',
	add_circle:'<path d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>',
	analytics:'<g><rect fill="none" height="24" width="24"/><g><path d="M19,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.1,3,19,3z M19,19H5V5h14V19z"/><rect height="5" width="2" x="7" y="12"/><rect height="10" width="2" x="15" y="7"/><rect height="3" width="2" x="11" y="14"/><rect height="2" width="2" x="11" y="10"/></g></g>',
	arrow: '<path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6-6-6z"/>',
	article:'<g><path d="M19,5v14H5V5H19 M19,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.1,3,19,3L19,3z"/></g><path d="M14,17H7v-2h7V17z M17,13H7v-2h10V13z M17,9H7V7h10V9z"/></g>',
	assessment:'<path d="M0 0h24v24H0V0z" fill="none"/><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z"/>',
	brightness: '<path d="M0 0h24v24H0V0z" fill="none"/><path d="M20 8.69V4h-4.69L12 .69 8.69 4H4v4.69L.69 12 4 15.31V20h4.69L12 23.31 15.31 20H20v-4.69L23.31 12 20 8.69zm-2 5.79V18h-3.52L12 20.48 9.52 18H6v-3.52L3.52 12 6 9.52V6h3.52L12 3.52 14.48 6H18v3.52L20.48 12 18 14.48zM12 6.5v11c3.03 0 5.5-2.47 5.5-5.5S15.03 6.5 12 6.5z"/>',
	calendar:'<g><rect fill="none" height="24" width="24"/></g><g><path d="M19,4h-1V2h-2v2H8V2H6v2H5C3.89,4,3.01,4.9,3.01,6L3,20c0,1.1,0.89,2,2,2h14c1.1,0,2-0.9,2-2V6C21,4.9,20.1,4,19,4z M19,20 H5V10h14V20z M19,8H5V6h14V8z M9,14H7v-2h2V14z M13,14h-2v-2h2V14z M17,14h-2v-2h2V14z M9,18H7v-2h2V18z M13,18h-2v-2h2V18z M17,18 h-2v-2h2V18z"/></g>',
	close:'<path d="M0 0h24v24H0V0z" fill="none"/><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>',
	delete:'<path d="M0 0h24v24H0z" fill="none"/><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>',
	done:'<path d="M0 0h24v24H0V0z" fill="none"/><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>',
	drag_handle:'<g><rect fill="none" height="24" width="24"/></g><g><g><g><path d="M20,9H4v2h16V9z M4,15h16v-2H4V15z"/></g></g></g>',
	drag_indicator:'<path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>',
	edit: '<path d="M0 0h24v24H0V0z" fill="none"/><path d="M14.06 9.02l.92.92L5.92 19H5v-.92l9.06-9.06M17.66 3c-.25 0-.51.1-.7.29l-1.83 1.83 3.75 3.75 1.83-1.83c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.2-.2-.45-.29-.71-.29zm-3.6 3.19L3 17.25V21h3.75L17.81 9.94l-3.75-3.75z"/>',
	edit_note:'<rect fill="none" height="24" width="24"/><path d="M3,10h11v2H3V10z M3,8h11V6H3V8z M3,16h7v-2H3V16z M18.01,12.87l0.71-0.71c0.39-0.39,1.02-0.39,1.41,0l0.71,0.71 c0.39,0.39,0.39,1.02,0,1.41l-0.71,0.71L18.01,12.87z M17.3,13.58l-5.3,5.3V21h2.12l5.3-5.3L17.3,13.58z"/>',
	folder:'<path d="M0 0h24v24H0z" fill="none"/><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>',
	fullscreen: '<path d="M0 0h24v24H0z" fill="none"/><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>',
	info:'<path d="M0 0h24v24H0V0z" fill="none"/><path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>',
	image:'<path d="M0 0h24v24H0V0z" fill="none"/><path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4.86 8.86l-3 3.87L9 13.14 6 17h12l-3.86-5.14z"/>',
	invert_colors:'<g><path d="M0,0h24v24H0V0z" fill="none"/></g><g><path d="M12,4.81L12,19c-3.31,0-6-2.63-6-5.87c0-1.56,0.62-3.03,1.75-4.14L12,4.81 M12,2L6.35,7.56l0,0C4.9,8.99,4,10.96,4,13.13 C4,17.48,7.58,21,12,21c4.42,0,8-3.52,8-7.87c0-2.17-0.9-4.14-2.35-5.57l0,0L12,2z"/></g>',
	label:'<path d="M0 0h24v24H0V0z" fill="none"/><path d="M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16zM16 17H5V7h11l3.55 5L16 17z"/>',
	layers:'<path d="M0 0h24v24H0V0z" fill="none"/><path d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16zm0-11.47L17.74 9 12 13.47 6.26 9 12 4.53z"/>',
	media_folder:'<path d="M0 0h24v24H0V0z" fill="none"/><path d="M2 6H0v5h.01L0 20c0 1.1.9 2 2 2h18v-2H2V6zm5 9h14l-3.5-4.5-2.5 3.01L11.5 9zM22 4h-8l-2-2H6c-1.1 0-1.99.9-1.99 2L4 16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 12H6V4h5.17l1.41 1.41.59.59H22v10z"/>',
	menu:'<path d="M0 0h24v24H0V0z" fill="none"/><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>',
	more:'<path d="M0 0h24v24H0z" fill="none"/><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>',
	pause: '<path d="M0 0h24v24H0V0z" fill="none"/><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>',
	person:'<path d="M0 0h24v24H0V0z" fill="none"/><path d="M12 6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2m0 10c2.7 0 5.8 1.29 6 2H6c.23-.72 3.31-2 6-2m0-12C9.79 4 8 5.79 8 8s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 10c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>',
	play : '<path d="M0 0h24v24H0z" fill="none"/><path d="M8 5v14l11-7z"/>',
	search: '<path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>',
	settings:'<path d="M19.43 12.98c.04-.32.07-.64.07-.98 0-.34-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.09-.16-.26-.25-.44-.25-.06 0-.12.01-.17.03l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.06-.02-.12-.03-.18-.03-.17 0-.34.09-.43.25l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98 0 .33.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.09.16.26.25.44.25.06 0 .12-.01.17-.03l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.06.02.12.03.18.03.17 0 .34-.09.43-.25l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zm-1.98-1.71c.04.31.05.52.05.73 0 .21-.02.43-.05.73l-.14 1.13.89.7 1.08.84-.7 1.21-1.27-.51-1.04-.42-.9.68c-.43.32-.84.56-1.25.73l-1.06.43-.16 1.13-.2 1.35h-1.4l-.19-1.35-.16-1.13-1.06-.43c-.43-.18-.83-.41-1.23-.71l-.91-.7-1.06.43-1.27.51-.7-1.21 1.08-.84.89-.7-.14-1.13c-.03-.31-.05-.54-.05-.74s.02-.43.05-.73l.14-1.13-.89-.7-1.08-.84.7-1.21 1.27.51 1.04.42.9-.68c.43-.32.84-.56 1.25-.73l1.06-.43.16-1.13.2-1.35h1.39l.19 1.35.16 1.13 1.06.43c.43.18.83.41 1.23.71l.91.7 1.06-.43 1.27-.51.7 1.21-1.07.85-.89.7.14 1.13zM12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>',
	sticky_note:'<path d="M19,5v9l-5,0l0,5H5V5H19 M19,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h10l6-6V5C21,3.9,20.1,3,19,3z M12,14H7v-2h5V14z M17,10H7V8h10V10z"/>',
	sync: '<path d="M.01 0h24v24h-24V0z" fill="none"/><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>',
	upload: '<g><rect fill="none" height="24" width="24"/></g><g><path d="M18,15v3H6v-3H4v3c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2v-3H18z M7,9l1.41,1.41L11,7.83V16h2V7.83l2.59,2.58L17,9l-5-5L7,9z"/></g>',
	volume: '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>',
	warning: '<path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>',
	wysiwyg:'<g><rect fill="none" height="24" width="24"/><path d="M19,3H5C3.89,3,3,3.9,3,5v14c0,1.1,0.89,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.11,3,19,3z M19,19H5V7h14V19z M17,12H7v-2 h10V12z M13,16H7v-2h6V16z"/></g>'
}

ut.icon = function(id, container, element){
	let svg = `<svg class="nui-icon ii_${id}" height="24px" viewBox="0 0 24 24" width="24px" fill="#ffffff">${ut.icon_shapes[id]}</svg>`;
	let out = svg;
	if(container) { out = `<div class="nui-icon-container">${svg}</div>`}
	if(element) { out = ut.htmlObject(out)}
	return out;
}

ut.detectEnv = function() {
	let detect = {
		isIE: ((navigator.appName === 'Microsoft Internet Explorer') || ((navigator.appName === 'Netscape') && (new RegExp('Trident/.*rv:([0-9]{1,}[.0-9]{0,})').exec(navigator.userAgent) !== null))),
		isEdge: (/Edge\/\d+/).exec(navigator.userAgent) !== null,
		isSafari : /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
		isFF: (navigator.userAgent.toLowerCase().indexOf('firefox') > -1),
    	isMac: (window.navigator.platform.toUpperCase().indexOf('MAC') >= 0),
		isTouch: navigator.maxTouchPoints >= 1,
		isIOS: ['iPad Simulator','iPhone Simulator','iPod Simulator','iPad','iPhone','iPod'].includes(navigator.platform) || (navigator.userAgent.includes("Mac") && "ontouchend" in document),
		isAudioVolume: (() => {let audio = new Audio(); audio.volume = 0.5; return audio.volume == 0.5})()
	}
	if(detect.isIOS){
		detect.IOSversion = iOSversion();
	}
	function iOSversion() {
		  if (window.indexedDB) { return 8; }
		  if (window.SpeechSynthesisUtterance) { return 7; }
		  if (window.webkitAudioContext) { return 6; }
		  if (window.matchMedia) { return 5; }
		  if (window.history && 'pushState' in window.history) { return 4; }
		  return 3;
	}

	return detect;
}

ut.webpSupport = function() {
	return new Promise((resolve, reject) => {
		const webP = new Image();
		webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
		webP.onload = webP.onerror = function () {
			if(webP.height === 2){
				resolve(true);
			}
			else{
				resolve(false);
			}
		}
	})
}

ut.avifSupport = function() {
	return new Promise((resolve, reject) => {
		var avif = new Image();
		avif.src = 'data:image/avif;base64,AAAAHGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZgAAAOptZXRhAAAAAAAAACFoZGxyAAAAAAAAAABwaWN0AAAAAAAAAAAAAAAAAAAAAA5waXRtAAAAAAABAAAAImlsb2MAAAAAREAAAQABAAAAAAEOAAEAAAAAAAAAIgAAACNpaW5mAAAAAAABAAAAFWluZmUCAAAAAAEAAGF2MDEAAAAAamlwcnAAAABLaXBjbwAAABNjb2xybmNseAABAA0AAIAAAAAMYXYxQ4EgAgAAAAAUaXNwZQAAAAAAAAAQAAAAEAAAABBwaXhpAAAAAAMICAgAAAAXaXBtYQAAAAAAAAABAAEEgYIDhAAAACptZGF0EgAKCDgM/9lAQ0AIMhQQAAAAFLm4wN/TRReKCcSo648oag==';
		avif.onload = function () { resolve(true) };
		avif.onerror  = function () { resolve(false) };
	})
}



ut.fb = function() {
	let out = [];
	let context;
	for(let i=0; i<arguments.length; i++){
		let item = arguments[i];
		if(typeof item === 'string' && item.startsWith('!ctx')){
			context = item.split('!ctx_')[1];
		}
		else {
			out.push(item);
		}
	}
	if(out.length < 2) {
		out = out[0];
	}
	if(context){ console.log(`%c ${context} `, "background-color:gray;", out) }
	else { console.log(out)}
}

ut.inlineSVG = function(classes){
	let images = ut.els('img');
	for(let i=0; i<images.length; i++){
		if(ut.getExtension(images[i].src) == 'svg'){
			fetch(images[i].src).then(response => response.text()).then(text => { 
				let svg = ut.htmlObject(text);
				images[i].parentNode.prepend(svg);
				images[i].parentNode.removeChild(images[i]);
				if(classes){ ut.addClass(svg, classes)}
			})
		}
	}
}

ut.slugify = function(str) {
	if(!str || str == '') { return false}
	str = str.trim();
	str = str.toLowerCase();
	str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
	str = str.replace(/[^a-z0-9 -]/g, '');
	str = str.replace(/\s+/g, '_');
	str = str.replace(/-+/g, '_');
	return str
}

ut.setTheme = function(_el, listen_for_change){
	let el = _el ? ut.el(_el) : document.body; 
	if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
		el.classList.add('dark');
	}
	else {
		el.classList.remove('dark');
	}
	if(listen_for_change){
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
			if(event.matches){
				el.classList.add('dark');
			}
			else {
				el.classList.remove('dark');
			}
		});
	}
}

/* needs to be better */
ut.isVisibleObserver = function(_el){
	let el = ut.el(_el);
	const observer = new IntersectionObserver((entries) => {
		if(entries[0].isIntersecting){
			el.isVisible = true;
		} else {
			el.isVisible = false;
		}
	});
	observer.observe(el);
}

ut.nedb = async function(url){
	let req = await fetch(url);
	let text = await req.text();
	text = text.split('\n');
	let out = [];
	for(let i=0; i<text.length; i++){
		try {
			out.push(JSON.parse(text[i]));
		}
		catch(err){
			
		}
	}
	return out;
}

ut.readHtml = function(url, element){
	return new Promise(async (resolve, reject) => {
		let req = await fetch(url);
		let html = await req.text();
		html = new DOMParser().parseFromString(html, 'text/html');
		if(element){ html = html.querySelector(element); }
		resolve(html);
	})
}

ut.videoEvents = function(target, cb, verbose){
	if(!cb) { cb = console.log; }
	let events = ['abort','canplay','canplaythrough','durationchange','emptied','ended','error','loadeddata','loadedmetadata','loadstart','pause','play','playing','progress','ratechange','seeking','seeked','stalled','suspend','volumechange','waiting']
	if(verbose) { events.push('progress'); events.push('timeupdate');}
	for(let i=0; i<events.length; i++){ target.addEventListener(events[i], cb);}
}

ut.eases = {
	'easeInOutQuad':(t, b, c, d) => { t /= d/2; if (t < 1) return c/2*t*t + b; t--; return -c/2 * (t*(t-2) - 1) + b; }
}

ut.ease = function(prop){
	prop.ease = prop.ease || 'easeInOutQuad';
	prop.duration = prop.duration || 1000;
	let startTime = null;

	function setValue(val){
		if(prop.progress) { prop.progress(val); }
		if(prop.target) { prop.target[prop.target_prop] = val; }
	}

	function animate(currentTime) {
		if (!startTime) { startTime = currentTime; }
		let timeElapsed = currentTime - startTime;
		let val = ut.eases[prop.ease](timeElapsed, prop.start, prop.end - prop.start, prop.duration);
		
		if (timeElapsed < prop.duration) {
			setValue(val);
			requestAnimationFrame(animate);
		}
		else {
			setValue(prop.end);
			if(prop.cb) { prop.cb(); }
		}
	  }
	requestAnimationFrame(animate);
}

export default ut;