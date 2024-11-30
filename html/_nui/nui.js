'use strict';
import ut from './nui_ut.js';
const nui = {};
window.nui = nui;

const consent_cookie_name = 'nui_ga_consent';
let fb = function() { ut.fb('!ctx_NUI', ...arguments)}



init();
async function init(){
	let env = ut.detectEnv();
	fb(env);

	nui.css_vars = ut.getCssVars();
	if(!nui.css_vars['--nui-main']){
		fb('Injecting nui_main.css')
		await ut.headImport({url:'./nui/css/nui_main.css', type:'css'});
		nui.css_vars = ut.getCssVars();
	}
	fb(nui.css_vars['--nui-main'].value);
}

nui.initWindow = function(win, content_width){
	nui.win = win;
	nui.sidebar = document.querySelector('#sidebar');
	nui.topbar = document.querySelector('#topbar');
	nui.content = document.querySelector('#content');
	nui.body = document.body;
	nui.content_width = content_width ? content_width : nui.css_vars['--space-page-maxwidth'].computed + nui.css_vars['--sidebar-width'].computed + (nui.css_vars['--space-frame'].computed *2);
	nui.win.addEventListener('resize', checkWindow);
	checkWindow();
	return win;
}

function checkWindow(e){
	let t = nui.win;
	nui.win_width = t.innerWidth;
	nui.win_height = t.innerHeight;
	if(nui.win_width > nui.content_width){
		nui.body.addClass('nui-sidebar-force');
	}
	else {
		nui.body.removeClass('nui-sidebar-force');
	}
	nui.body.removeClass('nui-sidebar-open');
}

nui.checkMenu = function(e){
	if(e.target.closest('.nui-content')){
		if(nui.body.hasClass('nui-sidebar-open')){
			nui.body.removeClass('nui-sidebar-open');
		}
	}
}

nui.renderTopBar = function(options){
	let target = options.target || document.body;
	let title = options.title || '<span>n000b<span style="font-weight: 900">_UI</span></span>';
	let html = ut.htmlObject(/*html*/ `
	<div id="topbar" class="nui-topbar noselect">
			<div class="nui-topbar-menu">
				<div>
					<div class="nui-icon-container">${ut.icon('menu')}</div>
					<div class="nui-topbar-title">${title}</div>
				</div>
			</div>
			<div class="nui-topbar-items">
			</div>
		</div>
	`)
	html.nui_options = options;
	html.app_menu = html.el('.nui-topbar-menu > div');
	html.app_menu.addEventListener('click', nui.toggleMenu);
	html.topbar_items = html.el('.nui-topbar-items');
	if(options.items){
		for(let i=0; i<options.items.length; i++){
			let item = ut.htmlObject(/*html*/`
				<div ${options.items[i].id ? 'id="' + options.items[i].id + '" ' : ''}class="nui-topbar-item nui-button-flash">
					<div class="nui-icon-container">${options.items[i].icon}</div>
					<span>${options.items[i].name}</span>
				</div>
			`)
			if(options.items[i].id) { item.id = options.items[i].id}
			item.options = options.items[i];
			item.addEventListener('click', itemClick);
			html.topbar_items.appendChild(item);
		}
	}

	target.appendChild(html);
	return html;

	function itemClick(e){
		if(e.currentTarget.options.fnc){
			e.currentTarget.options.fnc(e);
		}

	}

}

nui.renderNav = function(options){
	let data = options.nav;
	let target;
	let sidebar;
	let sidebar_top;
	let sidebar_bottom;

	if(options.target){
		target = options.target;
		sidebar_top = target;
	}
	else {
		target = document.body;
		sidebar = ut.createElement('div', {classes:'nui-sidebar noselect', target:target});
		sidebar_top = ut.createElement('div', {id:'sidebar_top', classes:'nui-sidebar-top', target:sidebar});
		sidebar_bottom = ut.createElement('div', {classes:'nui-sidebar-bottom', target:sidebar});
	}


	sidebar_top.options = options;
	window.addEventListener('click', nui.checkMenu)
	for(let i=0; i<data.length; i++){
		let item = {};

		if(data[i].sub){
			item = renderNavItem(data[i], i, true);
			ut.createElement('div', {target:item.el('.sub'), classes:'hline'});
			for(let n=0; n<data[i].sub.length; n++){
				item.el('.sub').appendChild(renderSubItem(i, n, data[i].sub[n]))
			}
			ut.createElement('div', {classes:'hline', target:item.el('.sub')})
		}
		else {
			item = renderNavItem(data[i], i, false);
			item.pid = data[i].id;
		}
		sidebar_top.appendChild(item);
	}

	function findItem(top, sub){
		let top_idx = -1;
		let sub_idx = -1;
		for(let i=0; i<data.length; i++){
			if(data[i].id == top){
				top_idx = i;
				if(data[i].sub && sub){
					for(let n=0; n<data[i].sub.length; n++){
						if(data[i].sub[n].id == sub){
							sub_idx = n;
						}
					}
				}
			}
		}
		let item = {}
		if(sub_idx >= 0){
			item = sidebar_top.el('#sidebar_' + top_idx + '_' + sub_idx);
		}
		else {
			item = sidebar_top.el('#sidebar_' + top_idx);
		}
	
		return item;
	}
	
	target.findItem = findItem;

	function renderNavItem(data_item, idx, hasSub){
		let item = ut.htmlObject( /*html*/ `
			<div id="sidebar_${idx}" class="nui-sidebar-item">
				<div class="item">
					<div class="nui-icon-container">${data_item.icon}</div>
					<span>${data_item.name}</span>
				</div>
			</div>
		`);
		if(data_item.special){
			let special = ut.createElement('div', {classes:'special', inner:`<div class="nui-icon-container">${data_item.special.icon}</div>`, target:item.el('.item')})
			special.addEventListener('click', data_item.special.fnc);
		}
		if(data_item.id == 'nav_section'){
			item.addClass('section')
			return item;
		}
		if(hasSub){
			item.addClass('group');
			item.hasSub = true;
			ut.createElement('div', {classes:'sub', target:item});
		}
		item.addEventListener('click', navClick)
		return item;
	}

	function renderSubItem(idx, sidx){
		let item = ut.htmlObject(`
			<div id="sidebar_${idx + '_' + sidx}" class="sub-item">
				<div class="nui-icon-container">${data[idx].sub[sidx].icon}</div>
				<span>${data[idx].sub[sidx].name}</span>
			</div>
		`);
		item.isSub = true;
		item.pid = data[idx].id;
		item.sid = data[idx].sub[sidx].id;
		item.addEventListener('click', navClick)
		return item;
	}


	function navClick(e){
		//e.stopPropagation();
		let item = e.currentTarget;
		let parent = item.closest('#sidebar_top');
		let idx = item.id.split('_')[1];
		let sidx = item.id.split('_')[2];
		clearSubs(parent);
		if(item.hasSub){
			item.addClass('open');
			item.el('.sub').style.height = item.el('.sub').scrollHeight + 'px';
		}
		else {
			parent.options.fnc(item);
			ut.toggleClass('body', 'nui-sidebar-open');
		}
	}

	target.setActive = (idx, sidx) => { return setActive(target, idx, sidx); }
	function setActive(target, idx, sidx){
		clearActive(target);
		clearSubs(target);
		let item = {};
		if(sidx){
			item = findItem(idx, sidx);
		}
		else {
			item = findItem(idx);
		}
		if(item.isSub){
			item.closest('.nui-sidebar-item').addClass('open');
			item.closest('.sub').style.height = item.closest('.sub').scrollHeight + 'px';
		}
		item.addClass('active');
	}

	function clearActive(target){
		let items = target.els('.nui-sidebar-item');
		items.forEach(item => {
			item.removeClass('active');
		})
		let sub_items = target.els('.sub-item');
		sub_items.forEach(item => {
			item.removeClass('active');
		})
	}

	function clearSubs(target){
		
		let subs = target.els('.sub');
		subs.forEach((item) => {
			item.closest('.nui-sidebar-item').removeClass('open');
			item.style.height = '0px';
		})
	}

	return target;
}


nui.toggleMenu = function(){
	document.body.classList.toggle('nui-sidebar-open');
}

console.warn('Breaking Change: loaderShow click event removed');
nui.loaderShow = function(target, msg="LOADING"){
	let html = ut.htmlObject( /*html*/ `
	<div id="loader" class="nui-overlay">
		<div class="nui-loader-spinner"></div>
		<div class="nui-loader-spinner-text">${msg}</div>
	</div>`
	)
	html.loader_text = html.el('.nui-loader-spinner-text');
	nui.animate(html, 'ani-scale-in');
	
	html.kill = (delay=0) => {
		setTimeout(() => {
			nui.animate(html, 'ani-fade-out', () => {
				html.parentNode.removeChild(html);
			})
		},delay)
	}
	html.progress = (s) => {
		html.loader_text.innerText = s;
	}

	if(!target){ target = document.body }
	target.appendChild(html)
	return html;
}



/* Overlay
##########################################################################################
########################################################################################## */

nui.overlay = function(options){
	let id = 'overlay' + ut.id();
	let html = ut.htmlObject(`
	<div id="${id}" class="nui-overlay ani-fade-in ${options.overlay_classes ? options.overlay_classes : ''}">
		<div class="container ani-scale-in ${options.container_classes ? options.container_classes : ''}">
		</div>
	</div>`)
	html.container = html.el('.container');
	html.smee = id;
	html.close = () => { nui.overlay_close({target:html})}

	if(options.html instanceof Element){
		html.container.appendChild(options.html);
	}
	else {
		html.container.innerHTML = options.html;
	}
	
	if(options.back_click_close){
		document.body.addEventListener('click', nui.overlay_close)
	}

	document.body.appendChild(html);
	return html;
}

nui.overlay_close = function(e){
	let item = e.target;
	if(item.smee){
		document.body.removeEventListener('click', nui.overlay_close)
		nui.animate(item, 'ani-fade-out');
		nui.animate(item.el('.container'), 'ani-scale-out', () => {
			item.parentNode.removeChild(item);
		})
	}
}

/* Modal Alert
##########################################################################################
########################################################################################## */

nui.alert = function (title, msg, fnc) {
	let id = ut.id();
	
	var temp = /*html*/ `
	<div id="${id}" class="nui-overlay ani-fade-in">
		<div class="nui-card nui-alert ani-scale-in">
			<div class="nui-headline">${title}</div>
			<span class="nui-copy">${msg}</span>
			<div class="nui-button-container right" style="">
				<button type="outline" id="btn_abort">Cancel</button>
				<button id="btn_ok">OK</button>
			</div>
		</div>
	</div>`;
	let html = document.createRange().createContextualFragment(temp).firstElementChild;

	html.el('#btn_abort').addEventListener('click', alert_action, {once:true})
	html.el('#btn_ok').addEventListener('click', nui.alert_action, {once:true})
	html.fnc = fnc;
	document.body.appendChild(html);
	
	function alert_action(e){
		
		nui.animate(html, 'ani-fade-out', alert_action_post);
		nui.animate(html.el('.nui-alert'), 'ani-scale-out');
		alert_action_post(e.currentTarget.id);
	}

	function alert_action_post(id) {
		let type = id.split('_')[0];
		let action = id.split('_')[1];
		html.el('#btn_abort').addEventListener('click', alert_action, {once:true})
		html.el('#btn_ok').addEventListener('click', nui.alert_action, {once:true})
		ut.killMe(html);
		if(html.fnc){ html.fnc(action);}
		html = null;
	}
}

nui.alert_action = function (e) {
	let item = e.currentTarget.closest('.nui-overlay');
	let type = e.currentTarget.id.split('_')[0];
	let action = e.currentTarget.id.split('_')[1];
	nui.animate(item, 'ani-fade-out', ut.killMe);
	nui.animate(item.el('.nui-alert'), 'ani-scale-out');
	if(item.fnc){ item.fnc(action);}
}

nui.alert_action_post = function(e){
	e.target.removeEventListener(e.type, nui.alert_action_post);
	e.target.parentNode.removeChild(e.target);
}

nui.alertPromise = function(title, msg){
	return new Promise((resolve, reject) => {
		nui.alert(title, msg, (e) => {
			resolve(e);
		})
	})
}

/* Error Notification
##########################################################################################
########################################################################################## */

nui.notification = function(op){
	let type = op.type ? op.type : 'inline';
	
	if(type == 'inline'){
		
		let target = op.target ? op.target : document.body;
		let time = op.time ? op.time : 3000;
		let message = op.message ? op.message : 'Unknown Error';
		let html = op.html ? op.html : ut.htmlObject(`<div class="nui-notification-inline error"><div class="nui-icon-container">${ut.icon('warning')}</div>${message}</div>`);
		if(typeof html === 'string'){ html = ut.htmlObject(html) }
		target.appendChild(html);
		nui.animate(html, 'ani-scale-in-vertical');
		setTimeout(() => {nui.animate(html, 'ani-scale-out-vertical', () => { ut.killMe(html) })}, time)
	}
}

/* Modal Login
##########################################################################################
########################################################################################## */

nui.login = function(prop){
	let html = ut.htmlObject( /*html*/ `
	<div id="login" class="nui-overlay">
			<div class="nui-card nui-login">
				<div class="container">
					<h2>${prop.title || 'Enter Credentials:'}</h2>
					<div class="nui-input style_1">
						<label>${prop.label_login || 'Login'}:</label>
						<input placeholder="" autocomplete="username">
					</div>
					<div class="nui-input style_1">
						<label>${prop.label_password || 'Password'}:</label>
						<input type="password" value="" autocomplete="current-password">
					</div>
					<div class="nui-button-container right">
						<button>${prop.label_button || 'Enter'}</button>
					</div>
				</div>
			</div>
		</div>`)
	if(!prop.title) { ut.killMe(html.el('.container h2'))};
	html.el_button = html.el('.nui-button-container button');
	html.el_container = html.el('.nui-login');
	html.inputs = html.els('input');
	html.login_callback = prop.callback;
	html.login_close = () => { 
		nui.animate(html.el_container, 'ani-scale-out')
		html.el_button.removeEventListener('click', html.login_action)
		nui.animate(html, 'ani-fade-out', ut.killMe);
	}
	html.login_action = function (e) {
		html.el_button.addClass('progress')
		html.login_values = {login:html.inputs[0].value, password:html.inputs[1].value}
		html.login_callback(html);
	}

	html.error = function(s){
		nui.notification({type:'inline', target:html.el_container, message:s});
		html.inputs[0].value = '';
		html.inputs[1].value = '';
		html.inputs[0].focus();
		setTimeout(() => { html.el_button.removeClass('progress'); },1000);
	}
	html.el_button.addEventListener('click', html.login_action);
	html.inputs[0].addEventListener('keydown', (e) => { if(e.keyCode == 13) { html.inputs[1].focus() }})
	html.inputs[1].addEventListener('keydown', (e) => { if(e.keyCode == 13){html.login_action()} })
	nui.animate(html, 'ani-fade-in');
	nui.animate(html.el_container, 'ani-scale-in');
	
	document.body.appendChild(html);
	setTimeout(() => html.inputs[0].focus(), 10);
	return html;
}



/* Modal Prompt
##########################################################################################
########################################################################################## */

nui.prompt = function(title, fields, fnc){
	let html = ut.htmlObject( /*html*/ `
	<div class="nui-overlay ani-fade-in">
		<div class="nui-card nui-alert nui-prompt ani-scale-in">
			<div class="nui-headline">${title}</div>
			<div class="container"></div>
			<div class="nui-button-container right" style="padding-top: 10px;">
				<button type="outline" id="btn_abort">Cancel</button>
				<button id="btn_ok">OK</button>
			</div>
		</div>
	</div>`)

	html.fields = fields;
	let container = html.el('.container');
	for(let i=0; i<fields.length; i++){
		let item = ut.htmlObject(`
			<div class="nui-input">
				<label>${fields[i].label}</label>
				<input id="${fields[i].id}" value="${fields[i].value ? fields[i].value : ''}">
			</div>
		`)
		container.appendChild(item);
	}
	html.tidx = -1;
	html.fnc = fnc;
	html.btn_ok = html.el('#btn_ok');
	html.btn_abort = html.el('#btn_abort');
	html.inputs = html.els('input');
	html.btn_abort.addEventListener('click', prompt_action, {once:true})
	html.btn_ok.addEventListener('click', prompt_action, {once:true})
	
	document.body.appendChild(html);


	window.addEventListener('keydown', tabTrap);
	function tabTrap(e){
		if(e.keyCode == 9){
			e.preventDefault();
			focusNext();
		}
		if(e.keyCode == 27){
			close();
		}
		if(e.keyCode == 13){
			prompt_action({currentTarget:{id:'btn_ok'}});
		}
	}

	function focusNext() {
		html.tidx++;
		if(html.tidx == html.inputs.length){ html.tidx = 0; }
		html.inputs[html.tidx].focus(); html.inputs[html.tidx].select()
	}

	function prompt_action(e) {
		let action = e.currentTarget.id.split('_')[1];
		let values = {};
		html.fields.forEach(fl => {
			values[fl.id] = html.el('#' + fl.id).value;
		})
		html.btn_ok.addClass('progress');
		html.fnc(action, values, () => { close() });
	}
	
	function close(){
		nui.animate(html, 'ani-fade-out', destroy);
		nui.animate(html.el('.nui-prompt'), 'ani-scale-out');
	}

	function destroy(){
		window.removeEventListener('keydown', tabTrap);
		html.btn_abort.removeEventListener('click', prompt_action, {once:true})
		html.btn_ok.removeEventListener('click', prompt_action, {once:true})
		ut.killMe(html);
	}

	setTimeout(focusNext, 10);
	return html;
}



/* Cookie Consent
##########################################################################################
########################################################################################## */
nui.consent = function(prop, cb){
	let action = 'abort';
	let html = ut.htmlObject( /*html*/ `
	<div class="nui-cookie-banner ani-scale-in">
		<div class="nui-card">
			<div class="text">${prop.text}</div>
			<div class="nui-button-container">
				<button type="reset" style="margin-right:auto">${prop.btn_abort}<span style="margin-left:0.5rem"></span></button>
				<button>${prop.btn_allow}</button>
			</div>
		</div>
	</div>`)

	html.btn_abort = html.els('.nui-button-container button')[0];
	html.btn_abort_text = html.btn_abort.el('span');
	html.btn_ok = html.els('.nui-button-container button')[1];
	
	html.btn_abort.addEventListener('click', close, {once:true})
	html.btn_ok.addEventListener('click', () => { action = 'allow'; close()}, {once:true})
	
	document.body.appendChild(html);
	let counter = 15;
	let timer = setInterval(countdown, 1000);

	function countdown(){
		if(counter < 0){
			clearInterval(timer);
			close();
		}
		html.btn_abort_text.innerText = '( ' + counter + ' )';
		counter--;
	}

	function close(){
		if(cb) { cb(action)}
		nui.animate(html, 'ani-scale-out', ut.killMe);
	}
}

/* Cookie Consent
##########################################################################################
########################################################################################## */


nui.ga_consent = function(ga_id, expire_hours=720){
	let options = {
		text: `<p>Sorry to bother you with this, but I would like to use Google Analystics to track traffic anonymously, <strong>is that OK?</strong>
			This window will go away on it's own and I'll assume you declined.</p>`,
		btn_abort:'Decline',
		btn_allow:'Allow'
	}

	if(ut.checkCookie(consent_cookie_name)){
		if(ut.getCookie(consent_cookie_name) == 'true'){
			nui.init_ga(ga_id);
		}
		else {
			fb('Google Analytics not allowed by user')
			nui.remove_ga(ga_id)
		}
	}
	else {
		nui.consent(options, (r) => {
			if(r == 'allow'){
				ut.setCookie(consent_cookie_name,'true', expire_hours);
				nui.init_ga(ga_id);
			}
			else {
				ut.setCookie(consent_cookie_name,'false', expire_hours);
			}
		})
	}
}

nui.init_ga = function(ga_id){
	fb('Init Google Analystics')
	window.ga_id = ga_id;
	ut.injectJS(`https://www.googletagmanager.com/gtag/js?id=G-${ga_id}`).then(() => {
		window.dataLayer = window.dataLayer || [];
		window.gtag = function() { window.dataLayer.push(arguments);}
		window.gtag('js', new Date());
		window.gtag('config', 'G-' + ga_id, { 'anonymize_ip': true, 'send_page_view': false });
		window.gtag('event', 'page_view', {
				page_title: 'home',
				page_location: document.location,
				page_path: document.locationHash,
			})
	});
}

nui.remove_ga = function(ga_id){
	ut.deleteCookie('_ga_' + ga_id);
	ut.deleteCookie('_ga');
}

nui.remove_consent = function(expire_hours=720){
	ut.setCookie(consent_cookie_name,'false', expire_hours);
	window.location.reload();
}





/* Modal Progress
##########################################################################################
########################################################################################## */

nui.modal_progress = function(title, close_cb){
	let html = ut.htmlObject( /*html*/ `
	<div class="nui-overlay ani-fade-in">
		<div class="nui-card nui-alert nui-modal-progress ani-scale-in">
			<div class="nui-headline">${title}</div>
			<div class="nui-progress-bar">
				<div class="prog_text">Starting ...</div>
				<div class="prog"><div class="proz"></div></div>
			</div>
			<div class="container"></div>
			<div class="nui-button-container right" style="padding-top: 10px;">
				<button id="btn_abort">Stop</div>
			</div>
		</div>
	</div>`)
	html.prog_text = html.el('.prog_text');
	html.prog_proz = html.el('.prog .proz');
	html.btn_abort = html.el('#btn_abort');
	html.close_cb = close_cb;
	html.close_fnc = () => { nui.modal_progress_close(html) };
	html.prog_fnc = (current, max) => {
		let proz = current / max;
		html.prog_text.innerText =  (current+1) + ' of ' + max;
		html.prog_proz.style.width = (proz*100) + '%';
	}
	
	html.btn_abort.addEventListener('click', nui.modal_progress_action, {once:true})
	document.body.appendChild(html);
	return html;
}

nui.modal_progress_action = function(e){
	let item = e.currentTarget.closest('.nui-overlay');
	let type = e.currentTarget.id.split('_')[0];
	let action = e.currentTarget.id.split('_')[1];
	item.btn_abort.addClass('progress');
	item.close_cb(type, action, () => { nui.modal_progress_close(item) });
}

nui.modal_progress_close = function(item){
	nui.animate(item, 'ani-fade-out', ut.killMe);
	nui.animate(item.el('.nui-modal-progress'), 'ani-scale-out')
}

/* Modal Page
##########################################################################################
########################################################################################## */

nui.modal_page = function(prop) {
	let target = prop?.target ? prop.target : document.body;
	let noFoot = prop?.buttons ? '' : ' noFoot';
	let relative = prop?.relative ? ' relative' : '';
	let style = prop?.maxWidth ? `max-width:${prop?.maxWidth}` : '';
	style +=  prop?.maxHeight ? `; max-height:${prop?.maxHeight}` : '';
	let html = ut.htmlObject(/*html*/`
		<div class="nui-overlay">
			<div class="nui-page-modal" data-type="${prop?.close_outside ? 'btn_abort' : ''}">
				<div class="main${noFoot}${relative}" style="${style}">
					<div class="header">
						<h2>${prop?.header_title ? prop.header_title : ''}</h2>
						<div class="close" data-type="btn_abort"><div class="nui-icon-container">${ut.icon('close')}</div></div>
					</div>
					<div class="body allowselect">
					</div>
					<div class="footer">
						<div class="left"></div>
						<div class="center"></div>
						<div class="right"></div>
					</div>
				</div>
			</div>
		</div>
	`)
	
	html.close_cb = prop?.callback || html.close;
	html.win = html.el('.nui-page-modal');
	if(prop.content){
		if(prop.content instanceof Element){
			html.el('.body').appendChild(prop.content);
		}
		else {
			ut.el('.body', html).innerHTML = prop.content;
		}
	}
	
	
	if(prop?.buttons){
		renderButtons(prop.buttons.left, html.el('.footer .left'));
		renderButtons(prop.buttons.center, html.el('.footer .center'));
		renderButtons(prop.buttons.right, html.el('.footer .right'));
	}

	function renderButtons(ar, target){
		if(ar){
			for(let i=0; i<ar.length; i++){
				ut.createElement('button', {
					target:target, 
					attributes: {type:ar[i].type}, 
					dataset: {type:ar[i].action}, 
					inner:ar[i].name
				})
			}
		}
	}


	html.addEventListener('click', close);
	html.el('.main .close').addEventListener('click', close );
	
	nui.animate(html, 'ani-fade-in')
	nui.animate(html.win, 'ani-scale-in');

	
	target.appendChild(html);
	
	function close(e){
		if(e.target.dataset.type){
			let type = e.target.dataset.type;
			html.close_cb({target:e.target, type:type});
		}
	}

	html.close = async () =>  { 
		nui.animate_away(html.win, 'ani-scale-out');
		nui.animate_away(html, 'ani-fade-out');

		//nui.animate(html, 'ani-fade-out', () => ut.killMe(html));
		//nui.animate_away(html, 'ani-fade-out');
	};

	return html;
}

/* Modal Page
##########################################################################################
########################################################################################## */

nui.window = function(prop) {
	let target = prop?.target ? prop.target : document.body;
	let noFoot = prop?.buttons ? '' : 'noFoot';
	let style = prop?.maxWidth ? `max-width:${prop?.maxWidth}` : '';
	style +=  prop?.maxHeight ? `; max-height:${prop?.maxHeight}` : '';
	let html = ut.htmlObject(/*html*/`
		<div class="nui-window" style="width:600px; height:400px">
			<div class="nui-page-modal" data-type="${prop?.close_outside ? 'btn_abort' : ''}">
				<div class="main ${noFoot}" style="${style}">
					<div class="header">
						<h2>${prop?.header_title ? prop.header_title : ''}</h2>
						<div class="close" data-type="btn_abort"><div class="nui-icon-container">${ut.icon('close')}</div></div>
					</div>
					<div class="body allowselect">
					</div>
					<div class="footer">
						<div class="left"></div>
						<div class="center"></div>
						<div class="right"></div>
					</div>
				</div>
			</div>
		</div>
	`)
	
	html.close_cb = prop?.callback || html.close;
	html.win = html.el('.nui-page-modal');
	if(prop.content){
		if(prop.content instanceof Element){
			html.el('.body').appendChild(prop.content);
		}
		else {
			ut.el('.body', html).innerHTML = prop.content;
		}
	}
	
	
	if(prop?.buttons){
		renderButtons(prop.buttons.left, html.el('.footer .left'));
		renderButtons(prop.buttons.center, html.el('.footer .center'));
		renderButtons(prop.buttons.right, html.el('.footer .right'));
	}

	function renderButtons(ar, target){
		if(ar){
			for(let i=0; i<ar.length; i++){
				ut.createElement('button', {
					target:target, 
					attributes: {type:ar[i].type}, 
					dataset: {type:ar[i].action}, 
					inner:ar[i].name
				})
			}
		}
	}


	html.addEventListener('click', close);
	html.el('.main .close').addEventListener('click', close );
	
	nui.animate(html, 'ani-fade-in')
	nui.animate(html.win, 'ani-scale-in');

	
	target.appendChild(html);
	
	function close(e){
		if(e.target.dataset.type){
			let type = e.target.dataset.type;
			html.close_cb({target:e.target, type:type});
		}
	}

	html.close = async () =>  { 
		nui.animate_away(html.win, 'ani-scale-out');
		nui.animate_away(html, 'ani-fade-out');

		//nui.animate(html, 'ani-fade-out', () => ut.killMe(html));
		//nui.animate_away(html, 'ani-fade-out');
	};

	return html;
}
/* Lightbox
##########################################################################################
########################################################################################## */

nui.lightbox = async function(obj){
	let classes = obj.classes ? obj.classes : 'nui-lightbox-overlay';
	let styles = obj.styles;
	let html = ut.htmlObject( /*html*/ `
	<div class="${classes} ani-fade-in" style="${styles} z-index:1001">
		<div class="nui-closy"></div>
		<div class="nui-lightbox"></div>
		<div class="nui-loader-spinner ani-fade-in"></div>
	</div>`)
	let lb = html.el('.nui-lightbox');
	html.close = function(e){
		e.stopPropagation();
		nui.animate(html, 'ani-fade-out');
		nui.animate(html.el('.nui-lightbox'), 'ani-scale-out', () => {
			html.parentNode.removeChild(html);
			if(html.vid){ html.vid.cleanUp(); }
			html.removeEventListener('click', html.close)
		})
		
	}
	lb.setAttribute('data-is', 'smee');
	if(obj.id) { html.id = obj.id }
	if(obj.type == 'image'){
		let img = new Image();
		img.src = obj.url;
		img.style.opacity = 0;
		img.addEventListener('load', (e) => {
				nui.animate(e.currentTarget, 'ani-scale-in');
				nui.animate(html.el('.nui-loader-spinner'), 'ani-fade-out', () => {ut.killMe(html.el('.nui-loader-spinner'))}) 
				e.currentTarget.style.opacity = 1;
			},
		{once:true})
		lb.appendChild(img);
		html.addEventListener('click', html.close)
	}
	if(obj.type == 'video' || obj.type == 'audio'){
		fb(obj.url);
		//html.vid = nui.createMediaPlayer(obj.url, obj.type, {classes:'vid inline'});
		if(!nui.mediaPlayer){
			import('../nui/nui_media_player.js').then( mod => { 
				nui.mediaPlayer = mod.default;
				addMedia(); 
			})
		}
		else {
			addMedia();
		}
		function addMedia(){
			html.vid = nui.mediaPlayer({url:obj.url, type:obj.type, autoplay:true, classes:'vid_inline'});
			html.vid.style.width = '100%';
			lb.appendChild(html.vid);
			nui.animate(html.el('.nui-loader-spinner'), 'ani-fade-out', () => {ut.killMe(html.el('.nui-loader-spinner'))})
		} 
	}
	document.body.appendChild(html);
	
	
	lb.addEventListener('click', (e) => { 
		if(e.target.dataset.is){
			html.close(e);
		}
	})
	html.el('.nui-closy').addEventListener('click', html.close)
	
}

nui.setupInput = function(target, fnc){
	if(target.type == 'text' || target.type == 'number'){
		target.addEventListener('change', inputEvents);
		target.addEventListener('blur', inputEvents);
		target.addEventListener('keyup', inputEvents);
	}
	if(target.type == 'fieldset'){
		target.addEventListener('change', fieldsetEvents);
	}
	
	function inputEvents(e){
		let el = e.currentTarget;
		if(e.type == 'keyup' && e.keyCode == 13){
			el.blur();
		}
		if(e.type == 'change'){
			fnc({'id':el.id, 'data':el.value});
		}
	}

	function fieldsetEvents(e){
		let el = e.currentTarget;
		if(e.type == 'change'){
			let els = el.querySelectorAll('input');
			let checked = [];
			let checked_ids = [];
			for(let i=0; i<els.length; i++){
				if(els[i].checked){
					checked.push(i)
					checked_ids.push(els[i].id);
				}
			}
			fnc({'id':el.id, 'idx':checked, 'data':checked_ids});
		}
	}
}

/* Experimental */
nui.bubble = function(prop){
	let bubble = ut.createElement('div', {classes:'nui-bubble', style:{opacity:0}, inner:'This is just a text'});
	let target = prop.target;
	function setPos(){
		console.log(target.parentNode.getBoundingClientRect());
		let t_rect = target.getBoundingClientRect();
		let b_rect = bubble.getBoundingClientRect();
		bubble.style.top = (t_rect.y - b_rect.height - (prop.offset_y || 0) ) + 'px';
		bubble.style.left = (t_rect.x + (t_rect.width / 2)) - (b_rect.width/2) +  'px';
	}
	
	window.addEventListener('resize', setPos);
	if(target.closest('.nui-content')){
		target.closest('.nui-content').addEventListener('scroll', setPos)
	}
	
	function hideBubble(){
		nui.animate_away(bubble);
		window.removeEventListener('resize', setPos);
		target.closest('.nui-content').removeEventListener('scroll', setPos)
	}
	setTimeout(hideBubble, 3000);
	//target.addEventListener('mouseout', hideBubble, {once:true})
	document.body.appendChild(bubble);
	setPos();
	bubble.style.transform = null;
	bubble.style.opacity = null;
}

/* Experimental */
nui.lazyFade = function(){
	let imgs = ut.els('img[loading]');
	for(let i=0; i<imgs.length; i++){
		if(!imgs[i].naturalHeight){
			imgs[i].style.transition = 'opacity 0.3s';
			imgs[i].style.opacity = 0;
			imgs[i].addEventListener('load', lazyLoadDone);
		}
	}
	function lazyLoadDone(e){
		let t = e.currentTarget;
		//t.removeEventListener('load', lazyLoadDone);
		t.style.opacity = null;
		t.style.transition = null;
	}
}

nui.loadPage = function(url, tag='main'){
	return new Promise(async (resolve, reject) => {
		let res = await fetch(url);
		let text = await res.text();
		let html = document.createRange().createContextualFragment(text).querySelector(tag);
		resolve(html);
	})
}

nui.openFileDialog = function (accept, callback) {
    var inputElement = document.createElement("input");
    inputElement.type = "file";
    inputElement.accept = accept;
	inputElement.multiple = true;
    inputElement.addEventListener("change", done)
    inputElement.dispatchEvent(new MouseEvent("click"));
	function done(e){
		inputElement.removeEventListener("change", done);
		callback(e.currentTarget.files);
		inputElement = null;
	} 
}


nui.animate = function(el, animation, cb){
	return new Promise((resolve, reject) => {
		el = ut.el(el);
		el.addEventListener('animationend', post);
		function post(e){
			requestAnimationFrame(() => {
				el.removeEventListener('animationend', post);
				ut.removeClass(el,animation);
				if(cb){ cb(el); }
				resolve(el);
			})
			
		}
		el.classList.add(animation);
	})
}


nui.animate_away = function(el, ani){
	return new Promise((resolve, reject) => {
		el = ut.el(el);
		if(ani) {
			nui.animate(el, ani, away);
		}
		else {
			nui.animate_transition(el, {
				callback:away,
				duration:0.2,
				ease: 'ease-in',
				remove: true,
				from: { opacity:'inherit'},
				to:{ opacity:0}
			})
		}
		function away(){
			ut.killMe(el); resolve(el);
		}
	})
}


/*experimental*/
nui.animate_transition = function(el, prop){
	return new Promise((resolve, reject) => {
		el = ut.el(el);
		el.aid = ut.id();
		if(prop.from){ from(to) }
		else{to()};
		
		
		function from(cb) {
			el.style.setProperty('transition', 'unset')
			el.css(prop.from);
			requestAnimationFrame(cb);
		}

		function to(){
			let keys = Object.keys(prop.to);
			el.style.transition = `all ${prop.duration}s ${prop.ease}`;
			el.style.transistionProperty = keys.join(',');
			el.css(prop.to);
			el.addEventListener('transitionend', prop.transition_back ? transitionback : transitionend);
			//setTimeout(()=>{fb('timeout')},prop.duration*1000)
		}

		function transitionback(e){
			if(e.target.aid == el.aid && prop.from.hasOwnProperty(e.propertyName)){
				el.removeEventListener('transitionend', transitionback);
				requestAnimationFrame(() => {
					el.addEventListener('transitionend', transitionend);
					el.css(prop.from);
				})
			}
		}

		function transitionend(e){
			if(e.target.aid == el.aid && prop.to.hasOwnProperty(e.propertyName)){
				el.removeEventListener('transitionend', transitionend);
				requestAnimationFrame(() => {
					el.style.transition = null;
					el.style.transistionProperty = null;
					if(prop.remove){
						el.css(prop.from, true);
						el.css(prop.to, true);
					}
					el.aid = 'done';
					if(prop.callback) { prop.callback(el) }
					resolve(el)
				})
			}
			else {
				//fb('Fail: ' + e.propertyName);
			}
		}
	})
}

export default nui;

