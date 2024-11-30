'use strict';
import ut from './nui_ut.js';

/*
	let cm = contextMenu(target_element, [
		{title:'Some Item', fnc:(t, e) => { nui.alert('Well done!', 'You picked: ' + e.currentTarget.title)}},
		{seperator:true},
		{title:'Another Item', fnc:(t, e) => { nui.alert('Well done!', 'You picked: ' + e.currentTarget.title)}},
		{title:'Second to last Item', fnc:(t, e) => { nui.alert('Well done!', 'You picked: ' + e.currentTarget.title)}},
		{seperator:true},
		{title:'Last Item', fnc:(t, e) => { nui.alert('Well done!', 'You picked: ' + e.currentTarget.title)}}
	])

*/

function contextMenu(target, ar){ 
	if(!target) { return;}
	target.addEventListener('contextmenu', open);
	let menu = {target:target, el:null, cleanUp:cleanUp};
	
	function cleanUp(){
		close();
		target.removeEventListener('contextmenu', open);
		menu = null;
	}

	function render(x, y) {
		let html = ut.createElement('div', {
			classes:'nui-contextmenu', 
			target:document.body,
			style: {top:y +'px', left:x + 'px'}
		})
		for(let i=0; i<ar.length; i++){
			if(ar[i].seperator){
				ut.createElement('div', {classes:'sep', target:html});
			}
			else {
				let item = ut.createElement('div', {classes:'item', id:'ctxidx_' + i, inner:ar[i].title, target:html});
				item.title = ar[i].title;
				item.addEventListener('click', (e) => { close(); ar[i].fnc(target, e) });
			}
		}
		return html;
	}

	function context_blur(e){
		if(e.target.closest('.nui-contextmenu') == null){
			close();
		}
	}

	function close(){
		if(menu.el){
			ut.killMe(menu.el)
			window.removeEventListener('click', close)
			menu.el = null;
		}
	}

	function open(e){
		let el = e.currentTarget;
		if(e.ctrlKey){
			return;	
		}
		e.preventDefault();
		close();
		menu.el = render(e.pageX, e.pageY);
		window.addEventListener('click', close);
	}

	return menu;
}

export default contextMenu;