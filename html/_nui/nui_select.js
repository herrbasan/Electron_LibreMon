'use strict';
import ut from "./nui_ut.js"
let fb = function() { ut.fb('!ctx_SEL', ...arguments)}
let css_vars;
/* SuperSelect
################################################################################################
################################################################################################ */

const superSelect = function(_el, settings){
	checkCSS('./nui/css/nui_select.css', '--nui-select').then(() => {
		initSuperSelect(_el, settings);
	});
	if(!_el){
		_el = renderSelect(settings);
		settings.target.appendChild(_el);
	}
	return _el;
}

const initSuperSelect = function(_el, settings){
	let id = ut.id();

	_el.settings = settings ? settings : {searchable:false, animation:true};
	if(_el.settings.animation == undefined) { _el.settings.animation = true};
	_el.ss_id = id;
	_el.style.display = 'none';
	
	
	_el.container = ut.createElement('div', {classes:`superSelect`});
	_el.body = ut.createElement('div', {classes:'ss-body', target:_el.container});
	_el.tags = ut.createElement('div', {classes:'ss-tags', target:_el.body});
	_el.tags_placeholder = ut.createElement('div', {classes:'ss-tag placeholder', inner:'Select an option...'});
	_el.button = ut.createElement('div', {classes:'ss-button', target:_el.body, inner:'Test'})

	_el.pulldown_icon = ut.createElement('div', {classes:'ss-icon-arrow', target:_el.container})
	_el.pulldown = ut.createElement('div', {classes:'ss-pulldown', target:_el.container});
	_el.pulldown_options = ut.createElement('div', {classes:'ss-pulldown-options', target:_el.pulldown});
	_el.search = ut.createElement('div', {classes:'ss-search'})
	_el.search_input = ut.createElement('input', {classes:'ss-search-input', target:_el.search, attributes:{type:'ss-search', placeholder:'Type something ...'}});
	_el.search_noresult = ut.createElement('div', {classes:'ss-option noresult', inner:_el.settings.noresult ? _el.settings.noresult : 'No Result.'});
	if(_el.settings.noresult_fnc){
		_el.search_noresult.addEventListener('click', _el.settings.noresult_fnc);
	}
	if(_el.settings.classes){
		_el.container.addClass(_el.settings.classes)
	}
	_el.search_icon = ut.createElement('div', {classes:'ss-icon-close', target:_el.search})
	_el.pulldown_open = false;
	_el.parentNode.insertBefore(_el.container, _el);
	
	_el.pulldown.style.display = 'none';
	_el.container.addEventListener('click', mainClick);
	_el.search_input.addEventListener('input', searchInput);
	_el.search_icon.addEventListener('click', (e) => { _el.search_input.value = ''; searchOptions(_el.search_input)})
	_el.container.select = _el;
	_el.filtered = [];
	_el.dispatcher = (type, detail) => { dispatcher(_el, type, detail) };
	_el.update = () => { update(_el) }
	_el.reRender = () => { reRender(_el) }
	_el.getSelected = () => { return getSelectedKeyValues(_el)}
	_el.reRender();
	_el.disable = () => { pulldownHide(_el); _el.disabled = true; _el.container.style.opacity = 0.5; _el.container.style.pointerEvents = 'none' }
	_el.enable = () => { _el.disabled = false; _el.container.style.opacity = null; _el.container.style.pointerEvents = null; }
	_el.addOption = (option) => { addOption(_el, option) };
	_el.addEventListener('change', _el.update);
	//_el.addEventListener('DOMSubtreeModified', _el.reRender);
	
	window.addEventListener('click', (e) => {
		if(e.target.closest('.superSelect') != null){
			let sel = e.target.closest('.superSelect').parentNode.querySelector('select');
			if(sel.ss_id != id && _el.pulldown_open){
				pulldownHide(_el);
			}
		}
		else if(_el.pulldown_open) {
			pulldownHide(_el);
		}
	})
	
	_el.pulldownHide = () => { pulldownHide(_el)};
	_el.pulldownShow = () => { pulldownShow(_el)};
	if(!window.ss_els){ window.ss_els = []; }
	window.ss_els.push(_el);
	//setupAccessibility(_el);
	return _el;
}

function renderSelect(settings){
	let html = ut.createElement('select');
	if(settings.multiple) { ut.attributes(html, {multiple:true})}
	for(let i=0; i<settings.options.length; i++){
		let item = settings.options[i];
		if(item.selected){
			ut.createElement('option', {target:html, attributes:{selected:true, value:item.value}, inner:item.name})
		}
		else {
			ut.createElement('option', {target:html, attributes:{value:item.value}, inner:item.name})
		}
	}
	return html;
}

function setupAccessibility(_el){
	_el.container.setAttribute('tabindex',0);
	_el.container.addEventListener('keyup', (e) => {
		if(e.keyCode === 13){
			if(document.activeElement.select.ss_id ===_el.ss_id){
				if(!_el.pulldown_open){
					pulldownShow(_el);
				}
				else {
					fb('oi')
				}
			}

		}
	})
}

function searchInput(e){
	if(!e.target.mute){
		setTimeout(() => searchOptions(e.target),200);
		e.target.mute = true;
	}
}

function searchOptions(input){
	let sel = input.closest('.superSelect').parentNode.querySelector('select');
	let options = sel.options;
	let val = input.value.toLowerCase();
	let found = [];
	if(val != undefined){
		let groups = sel.pulldown.querySelectorAll('.ss-group');
		for(let i=0; i<groups.length; i++){
			ut.hide(groups[i]);
		}
		for(let i=0; i<options.length; i++){
			let str = options[i].label.toLowerCase();
			ut.hide(options[i].pulldown_el);
			if(str.includes(val)){
				if(!options[i].disabled){ found.push(options[i]); }
				ut.show(options[i].pulldown_el);
				if(options[i].parentNode.tagName == 'OPTGROUP'){
					ut.show(options[i].pulldown_el.closest('.ss-group'));
				}
			}
		}
		
		if(found.length == 0){
			ut.show(sel.search_noresult);
		}
		else {
			ut.hide(sel.search_noresult);
		}
	}
	sel.filtered = found;
	clearOptionFocus(sel);
	sel.key_idx = undefined;
	updatePos(sel);
	input.mute = false;
}

function update(_el){
	if(_el.multiple){ 
		renderTags(_el);
		_el.tags.style.display = null; 
		_el.button.style.display = 'none';
	}
	else {
		_el.tags.style.display = 'none'; 
		_el.button.style.display = null;  
		renderButton(_el);
		pulldownHide(_el);
	}
	updatePulldown(_el);
	updatePos(_el);
	//renderPulldown(_el);
}

function reRender(_el){
	if(_el.multiple){ 
		renderTags(_el);
		_el.tags.style.display = null; 
		_el.button.style.display = 'none'; 
	}
	else {
		_el.tags.style.display = 'none'; 
		_el.button.style.display = null;  
		renderButton(_el);
	}
	renderPulldown(_el);
}

function mainClick(e){
	e.stopPropagation();
	if(e.target == e.currentTarget){
		let _el = e.currentTarget.closest('.superSelect').select;
		if(_el.pulldown_open){ pulldownHide(_el) }
		else { pulldownShow(_el); }
	}
}



/* PullDown
################################################################################################
################################################################################################ */

function renderPulldown(_el){
	let nodes = _el.childNodes;
	let target = _el.pulldown;
	ut.killKids(_el.pulldown);
	if(_el.settings.searchable){
		_el.pulldown.appendChild(_el.search);
	}
	for(let i=0; i<nodes.length; i++){
		if(nodes[i].nodeType == 1){
			if(nodes[i].nodeName == 'OPTION'){
				target.appendChild(renderPulldownItem(nodes[i]))
			}
			else if(nodes[i].nodeName == 'OPTGROUP'){
				target.appendChild(renderPulldownGroup(nodes[i]));
			}
		}
	}

	target.appendChild(_el.search_noresult);
	ut.hide(_el.search_noresult);
	function renderPulldownGroup(optgroup){
		let options = optgroup.querySelectorAll('option');
		let group = ut.createElement('div', {classes:'ss-group'});
		group.head = ut.createElement('div', {classes:'ss-group-head', target:group, inner:optgroup.label})
		group.options = ut.createElement('div', {classes:'ss-group-options', target:group})
		for(let i=0; i<options.length; i++){
			group.options.appendChild(renderPulldownItem(options[i]));
		}
		return group;
	}

	function renderPulldownItem(option){
		let item = {}
		if(option.pulldown_el){
			item = option.pulldown_el;
		}
		else {
			item = ut.createElement('div', {classes:'ss-option', inner:option.label});
			item.option = option;
			item.addEventListener('click', pulldownClick)
			//item.addEventListener('mouseover', clearOptionFocusIndex);
			optionFocusMouseEvents(item);
			option.pulldown_el = item;
		}
		if(option.selected) { item.classList.add('selected')}
		else { item.classList.remove('selected')};
		if(option.disabled) { item.classList.add('disabled')}
		else{ 
			item.classList.remove('disabled');
			item.setAttribute('tabindex', 0)
		};
		
		return item;
	}

}

function optionFocusMouseEvents(item){
	item.addEventListener('mouseover', () => {
		toggleOptionFocus(item.option);
	})
}


function pulldownClick(e){
	e.stopPropagation();
	let item = e.currentTarget;
	let option = item.option;
	optionSelect(option);
}

function optionSelect(option){
	let _el = option.closest('select');
	if(option.selected){
		option.selected = false;
		_el.dispatcher('change', {action:'deselect', option:option});
	}
	else {
		option.selected = true;
		_el.dispatcher('change', {action:'select', option:option});
	}

	_el.update();
	if(!_el.multiple){
		pulldownHide(_el);
	}
}

function pulldownShow(_el){
	
	window.ss_els.forEach(item => {
		if(item.ss_id != _el.id){
			pulldownHide(item);
		}
	});
	_el.hi_idx = undefined;
	_el.pulldown_open = true;
	_el.container.classList.add('open');

	ut.show(_el.pulldown);
	_el.pulldown.scrollTop = 0;
	_el.search_input.focus();
	
	ut.animate(_el.pulldown, 'ss-scale-in', null, _el.settings.animation);
	
	_el.dispatcher('pulldown', {action:'open'})
	
	let rect = _el.container.getBoundingClientRect();
	_el.pulldown_top = false;
	if(rect.y > window.innerHeight/2){
		_el.container.classList.add('top');
		_el.pulldown_top = true;

		_el.pulldown.scrollTop = _el.pulldown.scrollHeight;
	}
	_el.pulldown.addEventListener('keydown', pulldownKeyEvent);
	updatePos(_el);

	
}

function updatePos(_el){
	if(_el.pulldown_top){
		if(_el.settings.searchable){ 
			_el.pulldown.appendChild(_el.search);
			_el.search_input.focus(); 
		}
		_el.pulldown.style.top = -(_el.pulldown.offsetHeight + 2) + 'px';
		_el.pulldown.scrollTop = _el.pulldown.scrollHeight;
	}
	else {
		if(_el.settings.searchable){ 
			_el.pulldown.prepend(_el.search);
			_el.search_input.focus(); 
		}
	
		_el.pulldown.style.top = (_el.container.getBoundingClientRect().height) + 'px';
		_el.pulldown.scrollTop = 0;
	}
}


function pulldownHide(_el){
	if(_el.pulldown_open){
		_el.pulldown_open = false;
		
		
		if(_el.settings.searchable && _el.search_input.value != ''){
			_el.search_input.value = '';
			searchOptions(_el.search_input);
		}
		ut.animate(_el.pulldown, 'ss-scale-out', () => {
			_el.pulldown.style.top = null;
			ut.hide(_el.pulldown);
			_el.container.classList.remove('top');
			_el.container.classList.remove('open');
		}, _el.settings.animation)
		_el.pulldown.removeEventListener('keydown', pulldownKeyEvent);
		_el.dispatcher('pulldown', {action:'close'})
		clearOptionFocus(_el);
		_el.key_idx = undefined;
	}
}

function updatePulldown(_el){
	let options = _el.options;
	for(let i=0; i<options.length; i++){
		if(options[i].selected){
			options[i].pulldown_el.classList.add('selected');
		}
		else {
			options[i].pulldown_el.classList.remove('selected');
		}
	}
}

/* Keyboard
################################################################################################
################################################################################################ */



function pulldownKeyEvent(e){
	let _el = e.currentTarget.closest('.superSelect').select;
	let options = _el.options;
	if(_el.filtered.length > 0) { options = _el.filtered}
	if(e.code == 'Escape'){
		pulldownHide(_el);
	}
	if(e.code == 'Enter' || e.code == 'NumpadEnter'){
		for(let i=0; i<_el.options.length; i++){
			if(_el.options[i].isFocused){
				if(!_el.options[i].disabled){
					optionSelect(_el.options[i])
				}
			}
		}
	}
	if(e.code == 'ArrowUp' || e.code == 'ArrowDown'){
		
		e.preventDefault();
		e.stopPropagation();
		if(_el.key_idx == undefined) { _el.key_idx = 0}
		else {
			if(e.code == 'ArrowUp'){
				if(_el.key_idx < 1) { _el.key_idx = options.length-1 }
				else {_el.key_idx--}
			}
			if(e.code == 'ArrowDown'){
				if(_el.key_idx > options.length-2) { _el.key_idx = 0; }
				else {_el.key_idx++}
			}
		}
		toggleOptionFocus(options[_el.key_idx])
	}
}

function toggleOptionFocus(option){
	let _el = option.closest('select');
	clearOptionFocus(_el);
	setOptionFocus(option);
}

function setOptionFocus(option){
	option.pulldown_el.classList.add('hi');
	option.isFocused = true;
}

function removeOptionFocus(option){
	if(option.isFocused){
		option.pulldown_el.classList.remove('hi');
		option.isFocused = false;
	}
}

function clearOptionFocus(_el){
	for(let i=0; i<_el.options.length; i++){
		removeOptionFocus(_el.options[i]);
	}
}

function clearOptionFocusIndex(e){
	fb('clear key index')
	let _el = e.currentTarget.closest('.superSelect').select;
	_el.key_idx = undefined;
	clearOptionFocus(_el);
}


/* Tags
################################################################################################
################################################################################################ */

function addOption(_el, option){
	ut.createElement('option', {target:_el, inner:option.name, attributes:{value:option.value, selected:option.selected || false}});
	_el.reRender();
}

function renderTags(_el){
	let selected = getSelected(_el);
	ut.killKids(_el.tags);
	for(let i=0; i<selected.length; i++){
		let item = {};
		if(selected[i].tag_el){
			item = selected[i].tag_el;
		}
		else {
			item = ut.createElement('div', {classes:'ss-tag', inner:selected[i].label});
			ut.createElement('div', {target:item, classes:'ss-icon-close'});
			item.option = selected[i];
			item.select = _el;
			item.addEventListener('click', tagClick)
			selected[i].tag_el = item;
		}
		_el.tags.appendChild(item);
	}
	if(selected.length <= 0){
		_el.tags.appendChild(_el.tags_placeholder);
	}
}

function tagClick(e){
	e.stopPropagation();
	let _el = e.currentTarget.select;
	let option = e.currentTarget.option;
	option.selected = false;
	option.pulldown_el.classList.remove('selected');
	_el.update();
	_el.dispatcher('change', {action:'deselect', option:option});
}

function getSelected(_el){
	let data = _el.options;
	let out = [];
	for(let i=0; i<data.length; i++){
		if(Array.isArray(data[i])){
			for(let n=0; n<data[i].length; n++){
				if(data[i][n].selected){
					out.push(data[i][n]);
				}
			}
		}
		else {
			if(data[i].selected){
				out.push(data[i]);
			}
		}
	}
	
	return out;
}

function getSelectedValues(_el){
	let sel = getSelected(_el);
	let out = [];
	for(let i=0; i<sel.length; i++){
		out.push(sel[i].value)
	}
	return out;
}

function getSelectedKeyValues(_el){
	let sel = getSelected(_el);
	let out = [];
	for(let i=0; i<sel.length; i++){
		out.push({id:sel[i].value, name:sel[i].innerText})
	}
	return out;
}

function renderButton(_el){
	let selected = getSelected(_el);
	ut.killKids(_el.button);
	_el.button.innerHTML = selected[0].label;
}



/* Tools
################################################################################################
################################################################################################ */

function dispatcher(_el, type, detail){
	const event = new CustomEvent(type, {detail:detail});
	_el.dispatchEvent(event);
}

function checkCSS(url, prop){
	return new Promise(async (resolve, reject) => {
		if(!css_vars){
			css_vars = ut.getCssVars();
			if(!css_vars[prop]){
				fb('Injecting ' + url)
				await ut.headImport({url:url, type:'css'});
			}
			css_vars = ut.getCssVars();
			fb(css_vars[prop].value);
			resolve();
		}
		else {
			resolve();
		}
	})
}




export default superSelect;