'use strict';
import ut from './nui_ut.js';
import nui from './nui.js';
import generate from './nui_generate_data.js';
import superList from "../nui/nui_list.js";
import cms_block_media from "../nui/cms_blocks/cms_block_media.js";
import cms_block_richtext from "../nui/cms_blocks/cms_block_richtext.js";
import cms_block_text from "../nui/cms_blocks/cms_block_text.js";

let fb = function() { ut.fb('!ctx_BLK', ...arguments)}
fb = console.log;

let blocks = {};

function init(){
    return new Promise(async (resolve, reject) => {
        blocks.richtext = await cms_block_richtext();
        blocks.text = await cms_block_text();
        blocks.media = await cms_block_media();
        resolve(blocks);
    })
}



function renderMediaList(cb){

    let modal_prop = {
		header_title:'Insert Block',
		callback: closeMe,
        close_outside:true,
        relative:false,
		content: /*html*/ `<div class="media_superlist" style="position:relative; width:100%; height:100%"></div>`,
		maxWidth: '60rem',
	}

    
    let modal = nui.modal_page(modal_prop);
    modal.el('.body').style.padding = 0;
   
    let data = [];
	for(let i=1; i<361; i++){
		let item = {};
		item.idx = i;
		item.image = ut.lz(i,3);
		item.name = ut.lz(i,3);
		item.c_date = generate.date();
		item.m_date = generate.date();
		data.push(item);
	}

	let options = {
		id:'nui-superlist',
		verbose:false,
		/*events:(e) => { nuip.log(e?.target?.id + ' | ' + e.type + ' ' + e.value)},*/
		target:modal.el('.media_superlist'),
        single:false,
		data:data,
		render:ss_list_item,
		sort_default:2,
		sort:[
			{label:'Index', prop:'idx', numeric:true},
			{label:'Name', prop:'name'},
			{label:'Creation Date', prop:'c_date', numeric:true},
			{label:'Modification Date', prop:'m_date', numeric:true}
		],
		search: [
			{prop:'name'},
			{prop:'idx'}
		],
		footer: {
			buttons_left: [
				{type:'reset', label:'Delete', fnc:(e) => { fb(e)}},
				{type:'outline', label:'Clear', fnc:killList}
			],
			buttons_right: [
				{type:'', label:'Add', fnc:add}
			]
		}
	}

	

	let ss = superList(options);

	
    function killList(){
		fb('Kill')
		nuip.ss_list1.cleanUp();
		options = null;
		nuip.ss_list1 = null;
		delete nuip.ss_list1;
	}

	function add(e){
		let selection = ss.getSelection(true);
        if(cb) { cb(selection)}
        closeMe();
	}

	function ss_list_item(item){
		let html = ut.htmlObject( /*html*/ `
			<div class="superlist-list-item" style>
				<div>${ut.lz(item.idx,3)}</div>
				<div><img src="" style="opacity:0"></div>
				<div>${item.name}</div>
				<div>
					<div>${ut.formatDate(item.c_date).full}</div>
					<div>${ut.formatDate(item.m_date).full}</div>
				</div>
			</div>
		`)
		
		html.addEventListener('dblclick', (e) => { 
			nui.lightbox({type:'image', url:`slide/webp_full_hd/${data[e.target.oidx].image}.webp`})
		});

		html.img_el = html.el('img');
		html.update_delay = 100;
		html.update = () => {
			html.img_el.src = `slide/webp_thumb/${item.image}.webp`; 
			html.img_el.addEventListener('load', loaded)
		}
		function loaded(){
			html.img_el.removeEventListener('load', loaded)
			html.img_el.style.opacity = null;
			html.update = null;
		}
		return html;
	}

    function closeMe(e){
		modal.close();
        ss.cleanUp();
		options = null;
	}
    
}

export default init;