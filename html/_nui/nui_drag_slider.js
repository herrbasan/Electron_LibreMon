'use strict';
import ut from './nui_ut.js';

function dragSlider(target, fnc, interval=-1){
	let loopstop = false;
	let ds = {current:{}, computed:{}};

	target.addEventListener('mousedown', startDrag, {passive:false});
	target.addEventListener('touchstart', startDrag, {passive:false});

	ds.cleanUp = () => {
		//console.log('DragSlider CleanUp', target)
		loopstop = true;
		target.removeEventListener('mousedown', startDrag);
		target.removeEventListener('touchstart', startDrag);

		window.removeEventListener('touchmove', touchMove);
		window.removeEventListener('touchend', dragEnd);
		window.removeEventListener('mousemove', mouseMove);
		window.removeEventListener('mouseup', dragEnd);
		ds = null;
	}

	function loop(){ 
		if(loopstop) { return; }
		if(ds.current.last_x != ds.current.x || ds.current.last_y != ds.current.y){
			report(ds.current);
			ds.current.last_x = ds.current.x;
			ds.current.last_y = ds.current.y;
		}
		if(interval >= 0){ setTimeout(loop, interval); return;}
		requestAnimationFrame(loop);
	}

	function report(prop){
		let rect = target.getBoundingClientRect();
		let x = prop.x;
		let y = prop.y;
		let type = prop.type;

		x = x - rect.left;
		y = y - rect.top;
		if(x < 0) { x = 0; }
		if(y < 0) { y = 0; }
		if(x > rect.width) { x = rect.width}
		if(y > rect.height) { y = rect.height}
		ds.computed = {type:type, isTouch:prop.isTouch, x:x, y:y, prozX:x/rect.width, prozY:y/rect.height, clientX:prop.x, clientY:prop.y};
		fnc(ds.computed);
	}

	function startDrag(e){
		if(e.type == "touchstart"){
			e.stopPropagation(); 
			e.preventDefault();
			ds.current = {x:e.touches[0].clientX, y:e.touches[0].clientY, type:'start', isTouch:true};
			report(ds.current)
			window.addEventListener('touchmove', touchMove);
			window.addEventListener('touchend', dragEnd);
		}

		if(e.type == "mousedown"){
			ds.current = {x:e.clientX, y:e.clientY, type:'start', isTouch:false}
			report(ds.current)
			window.addEventListener('mousemove', mouseMove);
			window.addEventListener('mouseup', dragEnd);
		}
		ds.current.type = 'move';
		loopstop = false;
		requestAnimationFrame(loop);
	}

	function touchMove(e){
		ds.current = {x:e.touches[0].clientX, y:e.touches[0].clientY, type:'move', isTouch:true}
	}

	function mouseMove(e) {
		ds.current = {x:e.clientX, y:e.clientY, type:'move', isTouch:false}
	}

	function dragEnd(e){
		window.removeEventListener('touchmove', touchMove);
		window.removeEventListener('touchend', dragEnd);
		window.removeEventListener('mousemove', mouseMove);
		window.removeEventListener('mouseup', dragEnd);
		ds.isTouch = 'false';
		ds.current.type = 'end';
		if(e.touches){ds.isTouch = true; }
		report(ds.current);
		ds.current = {};
		ds.computed = {};
		loopstop = true;
	}

	return ds;
}

export default dragSlider;