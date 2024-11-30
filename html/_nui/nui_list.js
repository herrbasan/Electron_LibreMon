'use strict';
import ut from './nui_ut.js';
import superSelect from './nui_select.js';
let first = true;


/**
 * SuperList
 * @param {object} options Options
 * @param {Element} option.target Target to render the list into 
 * @returns 
 */
function superList(options) {
	let target = options.target;

	let sl = ut.htmlObject(/*html*/`
		<div id="${options.id || ut.id()}" class="superlist noselect">
			<div class="header">
				<div class="left">
					<label>Sort by:</label>
				</div>
				<div class="right">
					<div class="nui-input search">
						<div class="nui-icon-container">${ut.icon('search')}</div>
						<input placeholder="Search">
					</div>
				</div>
			</div>
			<div class="list">
				<div class="container"></div>
			</div>
			<div class="footer">
				<div class="left"></div>
				<div class="center"><div class="info"></div></div>
				<div class="right"></div>
			</div>
		</div>
	`)
	target.appendChild(sl);
	sl.list = sl.el('.list');
	sl.container = sl.el('.list .container');
	sl.header = sl.el('.header');
	sl.header_right = sl.header.el('.right');
	sl.header_search = sl.header.el('.right .search');
	sl.header_left = sl.header.el('.left');
	sl.footer = sl.el('.footer');
	sl.footer_left = sl.footer.el('.left');
	sl.footer_center = sl.footer.el('.center .info');
	sl.footer_right = sl.footer.el('.right');
	fb('Init');
	sl.registeredEvents = [];
	sl.currentSearch = '';

	if(options.logmode){ fb('List is in Logmode'); register_event(sl.container, 'wheel', logWheelMute, {passive:true}) }

	
	sl.options = options; // Maybe remove ?
	sl.data = options.data;
	sl.render = options.render;
	sl.event = options.events ? options.events : () => { }
	sl.sl_height = 60;

	sl.update = update;
	sl.getSelection = getSelection;
	sl.updateData = updateData;
	sl.appendData = appendData;
	sl.cleanUp = cleanUp;
	sl.reset = reset;
	sl.updateItem = updateItem;
	sl.updateItems = updateItems;

	sl.maxVis = 0;
	sl.offSet = 0;
	sl.stop = false;
	sl.win = window || target.ownerDocument.defaultView;
	
	register_event(sl.win, 'resize', resize);
	function resize(e, delay=30){ clearTimeout(sl.checkHeight_timeout); sl.checkHeight_timeout = setTimeout(checkHeight,delay); }
	register_event(sl.container, 'click', containerClick)
	function containerClick(e){ 
		if(e.target.oidx){ itemSelect(e.target, e); }
		else {
			let t = e.target.closest('.superlist-item');
			if(t){
				itemSelect(t, e);
			}
		} 
	}

	sl.checkHeight_interval = setInterval(checkHeight,3000);

	sl.observer = new IntersectionObserver((entries) => {
		if (entries[0].isIntersecting === true) {
			fb(sl, 'is Visible');
			sl.event({target:sl, type:'visibility', value:true});
			sl.stop = false;
			loop();
			resize(null, 0);
		}
		else {
			fb(sl, 'is Hidden');
			sl.event({target:sl, type:'visibility', value:false});
			sl.stop = true;
		}
	}, { threshold: [0] });
	sl.observer.observe(target);

	
	
	/* Header 
	######################################################################################################## */

	if(!options.sort && !options.search){ ut.killMe(sl.header)}
	else { 
		fb('Init Header');
		sl.hasHeader = true; 
		sl.addClass('hasHeader');
		if(!options.search){
			ut.killMe(sl.header_search);
		}
		else {
			register_event(sl.header_search, 'input', searchInput)
		}
		if(!options.sort){
			ut.killMe(sl.header_left.el('label'));
		}
		else {
			let settings = {target:sl.header_left, options:[]}
			for(let i=0; i<options.sort.length; i++){
				settings.options.push({name:options.sort[i].label, value:i})
			}
			if(options.sort_default){
				settings.options[options.sort_default].selected = true;
			}
			sl.sort_select = superSelect(null, settings);
			sl.currentSort = options.sort[options.sort_default || 0];
			sl.currentOrder = options.sort_direction_default || 'up';
			sl.last_order = options.sort_direction_default || 'up';
			register_event(sl.sort_select, 'change', selectChange)
			sl.sort_direction = ut.createElement('div', {classes:'up superSelect-direction', target:sl.header_left});
			register_event(sl.sort_direction, 'click', sortDirectionToggle)
		}
	}

	function selectChange(e){
		let idx = parseInt(e.detail.option.value);
		sl.currentSort = options.sort[idx];
		sl.event({target:sl, type:'sort_select', value:options.sort[idx]});
		filter();
	}

	function searchInput(e){
		clearTimeout(sl.filter_timeout);
		sl.currentSearch = e.target.value;
		sl.event({target:sl, type:'search_input', value:sl.currentSearch});
		sl.filter_timeout = setTimeout(filter, 100);
	}

	function sortDirectionToggle(e){
		if(sl.currentOrder == 'down'){
			sl.currentOrder = 'up';
			sl.sort_direction.addClass('up');
		}
		else {
			sl.currentOrder = 'down';
			sl.sort_direction.removeClass('up');
		}
		sl.last_sort = -1;
		filter();
	}

	/* Footer 
	######################################################################################################## */

	if(!options.footer){ ut.killMe(sl.footer)}
	else { 
		fb('Init Footer');
		sl.hasFooter = true; 
		sl.addClass('hasFooter');
		for(let i=0; i<options.footer.buttons_left.length; i++){
			let btn = ut.createElement('button', {attributes:{type:options.footer.buttons_left[i].type}, inner:options.footer.buttons_left[i].label, target:sl.footer_left})
			register_event(btn, 'click', options.footer.buttons_left[i].fnc);
		}
		for(let i=0; i<options.footer.buttons_right.length; i++){
			let btn = ut.createElement('button', {attributes:{type:options.footer.buttons_right[i].type}, inner:options.footer.buttons_right[i].label, target:sl.footer_right})
			register_event(btn, 'click', options.footer.buttons_right[i].fnc);
		}
	}
	

	/* Data 
	######################################################################################################## */

	function updateData(){
		sl.clone = [];
		for(let i=0; i<options.data.length; i++){
			sl.clone.push({oidx:i, el:null, data:options.data[i], selected:false})
		}
		//sl.filtered = sl.clone;
		filter();
		sl.container.style.height = sl.filtered.length * sl.sl_height + 'px';
	}

	function appendData(){
		if(sl.clone.length < options.data.length){
			for(let i=sl.clone.length; i<options.data.length; i++){
				sl.clone.push({oidx:i, el:null, data:options.data[i], selected:false})
			}
			//sl.filtered = sl.clone;
			filter();
			sl.container.style.height = sl.filtered.length * sl.sl_height + 'px';
			update(true)
		}
	}

	function updateItem(idx, data, force=true){
		if(data) { sl.clone[idx].data = data }
		sl.clone[idx].el = null;
		sl.clone[idx].selected = false;
		if(force) { update(true) }
	}

	function updateItems(ar, force=true){
		for(let i=0; i<ar.length; i++){
			if(ar[i].idx){
				updateItem(ar[i].idx, ar[i].data, false)
			}
			else {
				updateItem(ar[i]);
			}
		}
		if(force) { update() }
	}

	function filter(){
		let bench = performance.now();
		if(options.search && sl.currentSearch != ''){
			let props = [];
			for(let i=0; i<options.search.length; i++){
				props.push('data.' + options.search[i].prop);
			}
			sl.filtered = ut.filter({data:sl.clone, search:sl.currentSearch, prop:props, ignore_case:true});
			ut.killKids(sl.container);
		}
		else {
			sl.filtered = sl.clone;
		}
		sl.container.style.height = sl.filtered.length * sl.sl_height + 'px';
		sort();
		sl.lastSelect = null;
		reset();
		fb(`Filter operation took ${Math.round(performance.now() - bench)} ms`)
	}

	function sort(){
		if(options.sort){
			if(sl.last_sort != sl.currentSort){
				ut.sortByKey(sl.filtered, 'data.' + sl.currentSort.prop, sl.currentSort.numeric);
				sl.last_sort = sl.currentSort;
				if(sl.currentOrder == 'down') {
					sl.filtered.reverse();
			 	}
			}
		}
	}


	/* Render 
	######################################################################################################## */

	function update(force=false) {
		let data = sl.filtered;
		if(data.length > 0){
			sl.scrollPos = sl.list.scrollTop;
			if(sl.options.logmode && !sl.scrollMute){
				if(sl.list.scrollTop + sl.list.offsetHeight > sl.container.offsetHeight-(sl.sl_height+1)){
					sl.list.scrollTop = sl.container.offsetHeight;
					sl.scrollPos = sl.list.scrollTop;
				}
			}
			if (sl.scrollPos !== sl.lastScrollPos || force) {
				
				sl.maxVis = Math.ceil(sl.list.offsetHeight / sl.sl_height) + 6;
				sl.offSet = Math.floor(sl.scrollPos / sl.sl_height);
				if (sl.offSet < 0) { sl.offSet = 0; }
				if (sl.offSet > 0) { sl.offSet--; }

				for(let i=0; i < data.length; i++){
					if(i >= sl.offSet && i < (sl.maxVis + sl.offSet)){
						if(!data[i].el){
							data[i].el = renderItem(data[i]);
							appendItem(data[i].el);
						}
						if(!data[i].el.parentNode){
							appendItem(data[i].el);
						}
						if(data[i].selected){
							data[i].el.addClass('selected')
						}
						else {
							data[i].el.removeClass('selected')
						}
						data[i].el.fidx = i;
						data[i].el.style.top = i*sl.sl_height + 'px';
					}
					else {
						if(data[i].el){
							if(data[i].el.parentNode){
								//removeItem(sl.data[i]);
								sl.container.removeChild(data[i].el)
							}
						}
					}
				}
				if(sl.list.offsetHeight == 0){
					fb('Not Right')
				}
				else {
					sl.lastScrollPos = sl.scrollPos;
				}
			}
		}
		function appendItem(item){
			if(item.update){
				if(item.update_delay){
					item.timeout = setTimeout(item.update, item.update_delay);
				}
				else {
					update();
				}
			}
			sl.container.appendChild(item);
		}

		function renderItem(data){
			let el = sl.render(data.data)
			el.oidx = data.oidx;
			el.style.position = 'absolute';
			el.addClass('superlist-item');
			//el.style.top = idx*sl.sl_height + 'px';
			//el.addEventListener('click', itemClick)
			return el;
		}
	}

	function reset(e) {
		fb('Reset List')
		sl.event({target:sl, type:'list', value:'reset'});
		
			if(sl.options.logmode){
				sl.list.scrollTop = sl.container.offsetHeight;
				sl.scrollPos = sl.list.scrollTop;
				sl.lastScrollPos = -1;
			}
			else {
				sl.list.scrollTop = 0;
				sl.scrollPos = 0;
				sl.lastScrollPos = -1;
			}
		
		clearSelection();
		if(sl.hasFooter){ sl.footer_center.innerText = sl.filtered.length; }
		resize(null, 0);
	}

	/* Selection 
	######################################################################################################## */

	function itemSelect(_el, e){
		let idx = _el.fidx;
		let last = sl.lastSelect ? sl.lastSelect : 0;
		if(e.altKey){
			console.log(sl.filtered[idx].data);
		}
		else {
			if(e.shiftKey && !sl.options.single){
				if(e.ctrlKey){
					console.log(sl.options)
				}
				else {
					let range = [idx, last];
					range.sort((a,b) => { return a-b});
					clearSelection();
					for(let i=range[0]; i <= range[1]; i++){
						sl.filtered[i].selected = true;
					}
					sl.lastSelect = last;
				}
			}
			else if(e.ctrlKey && !sl.options.single){
				if(sl.filtered[idx].selected){
					sl.filtered[idx].selected = false;
				}
				else {
					sl.filtered[idx].selected = true;
					sl.lastSelect = idx;
				}
			}
			else {
				clearSelection();
				sl.filtered[idx].selected = true;
				sl.lastSelect = idx;
			}
		}

		let selection = getSelection(true);
		if(sl.hasFooter){
			if(selection.length == 0){
				sl.footer_center.innerText = sl.clone.length;
			}
			else {
				sl.footer_center.innerText = selection.length + ' of ' + sl.filtered.length;
			}
		}
		sl.event({target:sl, currentTarget:_el, type:'selection', value:selection.length, items:selection})
		update(true);
	}

	function clearSelection(){
		for(let i=0; i < sl.clone.length; i++){
			sl.clone[i].selected = false;
		}
	}

	function getSelection(full=false){
		let out = [];
		for(let i=0; i<sl.filtered.length; i++){
			if(sl.filtered[i].selected){
				if(full){
					out.push(sl.filtered[i]);
				}
				else {
					out.push(sl.filtered[i].oidx);
				}
			}
		}
		return out;
	}

	
	/* Misc 
	######################################################################################################## */

	function getComputedSize(el){
		let width = el.offsetWidth;
		let height = el.offsetHeight;
		let style = getComputedStyle(el);
		width += parseInt(style.marginLeft) + parseInt(style.marginRight);
		height += parseInt(style.marginTop) + parseInt(style.marginBottom);
		return {'width':width, 'height':height};
	}

	function checkHeight(){
		if(sl.container.firstChild){
			let height = getComputedSize(sl.container.firstChild).height;
			if(height != sl.sl_height){
				fb('Item Height Changed: ' + height)
				sl.event({target:sl, type:'height_change', value:height})
				sl.sl_height = height;
				sl.container.style.height = sl.filtered.length * sl.sl_height + 'px';
				update(true);
			}
		}
	}

	function register_event(target, event, fnc, options){
		fb('Register Event: ' + event + ' for ', target)
		sl.registeredEvents.push({target:target, event:event, fnc:fnc});
		target.addEventListener(event, fnc, options);
	}

	function logWheelMute(){
		if(!sl.scrollMute){
			clearTimeout(sl.scrollMuteTimeout);
			sl.scrollMute = true; 
			sl.scrollMuteTimeout = setTimeout(() => { sl.scrollMute = false},100)
		}
	}

	function fb(o) { 
		if(options.verbose) {
			if(arguments.length > 1){
				console.log('%c SL ', "background:#41658a;", [...arguments])
			}
			else {
				console.log('%c SL ', "background:#41658a;",  o)
			}
		}
	}

	function injectCss(){
		let doc = target.ownerDocument ? target.ownerDocument : document;
		var sheet = doc.createElement('style')
		sheet.innerHTML = /*css*/`
			.superlist {
				position: absolute;
				top: 0px;
				left: 0px;
				right: 0px;
				bottom: 0px;
				overflow-x: hidden;
				overflow-y: auto;
			}
			.superlist_container {
				position:relative
			}
		`
		doc.querySelector('head').prepend(sheet);
	}
	
	function cleanUp(){
		fb('CleanUp');
		sl.event({type:'list_cleanUp', value:'cleanup'})
		for(let i=0; i<sl.registeredEvents.length; i++) {
			sl.registeredEvents[i].target.removeEventListener(sl.registeredEvents[i].event, sl.registeredEvents[i].fnc);
			fb('Removed Event: ' + sl.registeredEvents[i].event);
		}
		clearInterval(sl.checkHeight_interval);
		ut.killKids(sl.container);
		sl.container = null;
		sl.filtered = [];
		sl.clone = [];
		sl.options = {};
		target.removeChild(sl);
		sl.observer.disconnect();
		sl = null;
	}

	function loop(){
		if(!sl){ return; }
		if(sl.stop){ return; }
		update();
		requestAnimationFrame(loop); 
	}

	updateData();
	reset();
	loop();
	return sl
}

export default superList;