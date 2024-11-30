'use strict';
import ut from './nui_ut.js';
import nui from './nui.js';
import contextMenu from './nui_context_menu.js';
import generate from './nui_generate_data.js';
//import cms_blocks from './nui_cms_blocks.js';

import cms_block_media from "../nui/cms_blocks/cms_block_media.js";
import cms_block_richtext from "../nui/cms_blocks/cms_block_richtext.js";
import cms_block_text from "../nui/cms_blocks/cms_block_text.js";
import cms_block_input from "../nui/cms_blocks/cms_block_input.js";
import cms_block_vars from "../nui/cms_blocks/cms_block_vars.js";
import cms_block_files from "../nui/cms_blocks/cms_block_files.js";

let block_types = {};
let fb = function() { ut.fb('!ctx_CMS', ...arguments)}
fb = console.log;

function init(prop, templates, media_browser, media_url, media_upload){
    fb('Load Page Editor')

    let editor = ut.htmlObject(/*html*/`
        <div class="nui-cms-page-editor">poop</div>
    `);
    
    editor.prop = prop;
    editor.templates = templates;
    editor.media_browser = media_browser;
    editor.media_upload = media_upload;
    editor.init_prop = structuredClone(prop);
    editor.update = () => renderSections(editor);
    
    initBlocks(media_browser, media_url, media_upload).then(editor.update);
    if(prop.target) { prop.target.appendChild(html)}
	return editor;
}

function initBlocks(media_browser, media_url, media_upload){
    return new Promise(async (resolve, reject) => {
        block_types.richtext = await cms_block_richtext();
        block_types.text = await cms_block_text();
        block_types.input = await cms_block_input();
        block_types.media = await cms_block_media({media_browser:media_browser, media_url:media_url, media_upload:media_upload});
        block_types.files = await cms_block_files({media_browser:media_browser, media_url:media_url, media_upload:media_upload});
        block_types.vars = await cms_block_vars();
        resolve(block_types);
    })
}

/* Sections 
########################################################################################################## */

function renderSections(editor){
    console.log(editor.prop);
    let scroll_mem = 0;
    let container = editor.closest('.body');
    if(container){
        let content_height = editor.offsetHeight;
        let container_height = container.getBoundingClientRect().height;
        scroll_mem = container.scrollTop;
        if((scroll_mem - (content_height - container_height)) > 0){
            scroll_mem = content_height;
        }
    }
    if(editor.rendered_elements){
        for(let n=0; n<editor.rendered_elements.length; n++){
            if(editor.rendered_elements[n].destroy){
                editor.rendered_elements[n].destroy();
            }
        }
    }
    ut.killKids(editor);
    editor.rendered_elements = [];
    editor.sections = [];
    for(let i=0; i<editor.prop.sections.length; i++){;
        let section_prop = editor.prop.sections[i];
        section_prop.idx = i;
        let section_html = renderSection(section_prop, editor);
        editor.sections.push(section_html);
        editor.appendChild(section_html);
    };
    if(container){
        container.scrollTop = scroll_mem;
    }
}

function renderSection(prop, editor){
    let html = ut.htmlObject(/*html*/`
        <div class="nui-cms-section ${prop.type || ''}">
            <div class="wrap">
                <div class="header">
                    <div class="title">
                        ${ut.icon('drag_indicator',true)}
                        <div class="idx"></div>
                        <label>${prop.label || 'Section'}</label>
                    </div>
                    <div class="side">
                        <div class="classes">${prop.class || '<span>...</span>'}</div>
                        <div class="nui-button-container right">
                        </div>
                    </div>
                </div>
                <div class="content"></div>
            </div>
            <div class="footer"><div class="add">${ut.icon('add_circle',true)}</div></div>		
        </div>
    `)

    editable(html.el('.header .title label'), prop, 'label');
    editable(html.el('.header .side .classes'), prop, 'class');
    

    let cm = contextMenu(html.el('.header'), [
        {title:'Get Data', fnc:() => {console.log(html.prop)}},
        {title:'Re-Render', fnc:() => renderSections(editor)}  
    ])

    let addSection = () => { 
        editor.prop.sections.splice(prop.idx+1, 0, { name: "section", label: "Section", groups: []}); 
        editor.update(); 
    }

    let deleteSection = () => {
        if(editor.prop.sections.length > 1){
            editor.prop.sections.splice(prop.idx,1);
        }
        else {
            editor.prop.sections[0].groups = []; 
        }
        editor.update();
    }

    html.footer = html.el('.footer');
    html.footer.addEventListener('click', addSection);

    html.prop = prop;
    html.content = html.el('.content');
    html.content.appendChild(renderTopAdd(prop.groups, 0, editor));

    for(let i=0; i<prop.groups.length; i++){
        let group_prop = prop.groups[i];
        let group_html = ut.createElement('div', {classes:'group'});
        group_prop.idx = i;
        group_html.prop = prop.groups;
        html.content.appendChild(group_html);
        renderGroup(group_html, i, editor);
    }
    
    html.btn_delete = ut.createElement('button', {
        id:'nui-cms-block-button_delete', 
        inner:`${ut.icon('close',true)}`, 
        attributes:{type:'delete'}, target:html.el('.nui-button-container'), 
    })
    html.btn_delete.addEventListener('click', deleteSection)

    
    html.destroy = () => {
        html.footer.removeEventListener('click', addSection);
        html.btn_delete.removeEventListener('click', deleteSection)
    }

    editor.rendered_elements.push(html);

    return html;
}

/* Groups 
########################################################################################################## */

function renderGroup(group_html, idx, editor){
    if(group_html.prop[idx].columns){
        group_html.appendChild(renderColumnBlock(group_html.prop[idx]));
    }
    else {
        group_html.appendChild(renderBlock(group_html.prop, idx, editor));
    }

    function renderColumnBlock(obj){
        let columns = obj.columns;
        let html = ut.htmlObject(/*html*/`
            <div class="nui-cms-columns">
                <div class="header">
                    <div class="title">${ut.icon('drag_indicator',true)}<div class="name"><label>${obj.label || 'Columns'}</label></div></div>
                    <div class="side">
                    <div class="classes">${obj.class || '<span>...</span>'}</div>
                    <div class="nui-button-container right">
                    </div>
                </div>
                </div>
                <div class="body hasColumns">
                    
                </div>
                <div class="footer"><div class="add">${ut.icon('add_circle',true)}</div></div>		
            </div>
        `)
        let content = html.el('.body');
        let addBlock = (e) => { renderBlockList(group_html.prop, idx, editor, e)}
        let deleteBlock = () => { group_html.prop.splice(idx,1); editor.update(); };
        html.footer = html.el('.footer');
        html.btn_delete = ut.createElement('button', {id:'nui-cms-block-button_delete', inner:`${ut.icon('close',true)}`, attributes:{type:'delete'}, target:html.el('.nui-button-container')})
        html.btn_delete.addEventListener('click', deleteBlock);
        html.footer.addEventListener('click', addBlock);
        /*html.header_label = html.el('.header .title label');
        html.header_label.addEventListener('click', (e) => { changePrompt(obj, 'label', (value) => {html.header_label.innerText = value})});*/

        editable(html.el('.header .title label'), obj, 'label');
        editable(html.el('.header .side .classes'), obj, 'class');

        for(let i=0; i<columns.length; i++){
            content.appendChild(renderBlocks(columns[i], i));
        }

        html.destroy = () => {
            html.btn_delete.removeEventListener('click', deleteBlock);
            html.footer.removeEventListener('click', addBlock);
        }

        editor.rendered_elements.push(html);
        return html;
    }

    function renderBlocks(blocks, b_idx){
        let html =  ut.createElement('div', {classes:'nui-cms-block'});
        html.appendChild(renderTopAdd(blocks, 0, editor));
        for(let i=0; i<blocks.length; i++){
            blocks[i].parent_name = 'C' + (b_idx+1),
            blocks[i].idx = i;
            html.appendChild(renderBlock(blocks, i, editor));
        }
        return html;  
    } 
}


/* Block 
########################################################################################################## */

function renderBlock(blocks, idx, editor){
    let block = blocks[idx];
    let title = `<div class="name">${(block.parent_name ? '<div>' + block.parent_name + '</div>' : '')}<div>${block.idx+1}</div><label>${(block.label || 'CMS Block')}</label></div>` 
    let html = ut.htmlObject(/*html*/`
        <div class="nui-cms-block">
            <div class="header">
                <div class="title">${ut.icon('drag_indicator',true)}${title}</div>
                <div class="side">
                    <div class="classes">${block.class || '<span>...</span>'}</div>
                    <div class="nui-button-container right"></div>
                </div>
            </div>
            <div class="body">
                
            </div>
            <div class="footer"><div class="add">${ut.icon('add_circle',true)}</div></div>		
        </div>
    `)
    
    let cm = contextMenu(html.el('.header'), [{title:'Get Data', fnc:() => {console.log(block)}} ])
    let addBlock = (e) => { renderBlockList(blocks, idx, editor, e); };
    let deleteBlock = (e) => {blocks.splice(block.idx,1); editor.update(); };
    

    html.footer = html.el('.footer');
    html.btn_delete = ut.createElement('button', {id:'nui-cms-block-button_delete', inner:`${ut.icon('close',true)}`, attributes:{type:'delete'}, target:html.el('.nui-button-container')})
    html.btn_delete.addEventListener('click', deleteBlock);
    html.footer.addEventListener('click', addBlock);
    /*html.header_label = html.el('.header .title label');
    html.header_label.addEventListener('click', (e) => { changePrompt(block, 'label', (value) => {html.header_label.innerText = value})});*/

    editable(html.el('.header .title label'), block, 'label');
    editable(html.el('.header .side .classes'), block, 'class');

    /*function clickLabel(e){
        let prompt = nui.prompt('Change Item', [{id:'block_label', label:'Block Name:', value:block.label}], changeLabel)
        function changeLabel(action, values, cb){
            if(action != 'ok') { cb(); return; }
            html.header_label.innerText = values.block_label;
            block.label = values.block_label;
            cb();
        }
    }*/


    if(block.type == 'media'){
        if(block.data === '!lorem'){
            let rand = Math.ceil(Math.random()*10);
            block.data = [];
            for(let i=0; i<rand; i++){
                block.data.push({type:'image', mime:'image/webp', _id:ut.lz(Math.ceil(Math.random()*360),3)});
            }
        }
    }
    else {
        if(block.data.includes('!lorem')){ 
            block.data = lorem();
        }
    }
    
    html.block = block_types[block.type](block, editor.media_browser);
    html.el('.body').appendChild(html.block);
    

    html.destroy = () => {
        html.btn_delete.removeEventListener('click', deleteBlock);
        html.footer.removeEventListener('click', addBlock);
        if(html.block.destroy) { html.block.destroy(); }
    }
    editor.rendered_elements.push(html);
    return html;
}

function renderTopAdd(blocks, idx, editor){
    let html = ut.htmlObject(/*html*/`
        <div class="top-add">
            <div class="add">${ut.icon('add_circle',true)}</div>
        </div>
    `)
    let addBlock = (e) => { renderBlockList(blocks, -1, editor, e)};
    html.addEventListener('click', addBlock)
    html.destroy = () => { html.removeEventListener('click', addBlock)}
    editor.rendered_elements.push(html);
    return html;
}

function changePrompt(data, key, change_cb){
    let prompt = nui.prompt('Change Item', [{id:'fld_'+key, label:`Change "${data[key]}" to:`, value:data[key]}], done)
    function done(action, values, prompt_cb){
        if(action != 'ok') { prompt_cb(); return; }
        data[key] = values['fld_'+key];
        prompt_cb();
        change_cb(values['fld_'+key]);
    }
}

function editable(_el, data, key){
    _el.addEventListener('click', showPrompt)
    function showPrompt(){
        let prompt = nui.prompt('Change Item', [{id:'fld_'+key, label:`Change "${data[key]}" to:`, value:data[key]}], done)
        function done(action, values, prompt_cb){
            if(action != 'ok') { prompt_cb(); return; }
            let value = values['fld_'+key]
            
            if(key == 'class'){
                if(!value || value == ''){
                    _el.innerText = '...';
                    delete data[key];
                    prompt_cb();
                    return;
                }
            }
            if(!value || value == ''){
                data[key] = 'no name';
                _el.innerText = 'no name';
            }
            else {
                data[key] = value;
                _el.innerText = value;
            }
            prompt_cb();
        }
    }
}




/* Block List 
########################################################################################################## */

function renderBlockList(blocks, idx, editor, event) {
    let templates = editor.templates;
    let columns = true;
    if(event) { if(event.currentTarget.closest('.hasColumns')) { columns = false;} }
    
    
    if(!columns){
        templates = templates.filter(item => item.type != 'columns');
    }
	let prop = {
		header_title:'Insert Block',
		callback: closeMe,
        close_outside:true,
        relative:true,
		content: '',
		buttons: {
			left: [{type:'outline', name:"Cancel", action:'btn_cancel'}],
			right: [{type:'', name:"Add", action:'btn_ok'}]
		},
		maxWidth: '40em'
	}

    let content = ut.createElement('div', {classes:'nui-cms-addblocklist'});
    content.items = [];
    for(let i=0; i<templates.length; i++){
        let html = ut.htmlObject(/*html*/`
            <div class="item">
                <div class="icon">${ut.icon('article',true)}</div>
                <div class="name">${templates[i].label}</div>
            </div>
        `)
        html.selected = false;
        html.addEventListener('click', clicky)
        content.items.push(html);
        content.appendChild(html);
    }

    function clicky(e){
        unselect();
        e.currentTarget.selected = true;
        e.currentTarget.addClass('active');
    }

    function unselect(){
        for(let i=0; i < content.items.length; i++){
            content.items[i].selected = false;
            content.items[i].removeClass('active');
        }
    }
    prop.content = content;
	let modal = nui.modal_page(prop);

	function closeMe(e){
		if(e.type == 'btn_something'){
			e.target.addClass('progress');
			setTimeout(modal.close, 1000);
		}
		else {
            for(let i=0; i<content.items.length; i++){
                if(content.items[i].selected){
                    blocks.splice(idx+1, 0, ut.clone(templates[i]))
                    editor.update();
                }
            }
			modal.close();
		}
		
	}
}


let lorem = () =>  { return generate.text({
    sentences_per_paragraps:{num:1, random:false},
    paragraphs:{num:2, random:false},
    randomize_words:false,
    html:{
        headlines: true,
        subheadlines: true,
        tables:false,
        tags: true,
        lists: true,
        quotes: true
    }
})}


export default init;

