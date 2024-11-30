'use strict';
var ipsum = [
	"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
	"Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
	"Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
	"Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
	"Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.",
	"Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.",
	"Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.",
	"Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur?",
	"Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?",
	"At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga.",
	"Et harum quidem rerum facilis est et expedita distinctio.",
	"Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus.",
	"Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae.",
	"Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat.",

	"Atqui in Confessionibus suis Augustinus totum se ipse expressit perquam accurate: quippe qui in iis non ea solum facta quae hominum oculis subjecta esse potuissent; sed etiam ea quae Deo tantum conscio in intimis agitaverat, cum bona, tum mala, singillatim exposuit.",
	"In his enim sicuti anteactae vitae vel levissima errata, sic etiam accepta a Deo beneficia fuse commemorat; aeternum posteris relicturus sive poenitentis, sive grati animi monumentum, praeclarum etiam illius quam constanter erga nos exhibet Deus, et justitiae et bonitatis exemplum.",
	"Atque hoc in primis studebat, scilicet (ipsius verbis rem ut explicemus) et de malis et de bonis suis Deum laudare justum et bonum, atque in eum excitare humanum intellectum et affectum.",
	"Id vero hac ratione exequitur.",
	"In primo libro, praemissa Dei invocatione, recolit vitae suae primordia ad annum quintum decimum.",
	"Infantiae peccata agnoscit et pueritiae; atque hac aetate in lusum et puerilia quaeque oblectamenta et vitia, quam in litterarum studia procliviorem se fuisse confitetur.",
	"In secundo, ad aetatem aliam progreditur, primumque adolescentiae suae, id est, sextum decimum vitae annum, quem in paterna domo, studiis intermissis, consumpserat genio ac libidinibus indulgens, ad mentem revocat cum gravi dolore, severus admodum in dijudicando furto a se tunc temporis cum sodalibus perpetrato.",
	"Tertius liber de annis est aetatis illius decimo septimo, decimo octavo et decimo nono transactis Carthagine, ubi dum litterarii studii curriculum absolveret, se libidinosi amoris laqueo irretitum, necnon in Manichaeorum haeresim prolapsum fuisse meminit.",
	"Adversus horum errores et ineptias disserit luculenter.",
	"Matris lacrymas, et responsum de filii resipiscentia divinitus acceptum refert.",
	"In quarto libro eum pudet se illi sectae addictum fuisse per novennium, atque alios secum in eumdem errorem pertraxisse; deinde amicum charissimum sibi interea morte praereptum, acerbiori quam aequum esset animi dolore fuisse prosecutum.",
	"Cujus occasione, de vana et de solida amicitia non pauca dicit.",
	"Mentionem denique facit librorum de Pulchro et Apto a se anno aetatis vigesimo sexto aut vigesimo septimo conscriptorum; necnon quam facili negotio liberalium artium libros atque Aristotelis Categorias, anno aetatis ferme vigesimo, per sese intellexerit.",
	"In libro quinto annum aetatis suae exhibet vigesimum nonum, quo scilicet comperta Fausti manichaei imperitia, propositum in illa secta proficiendi abjecit; quo etiam Roma, ubi tunc rhetoricam profitebatur, missus Mediolanum ut eamdem artem doceret, coepit audito Ambrosio resipiscere, et de Manichaeismo abdicando necnon de repetendo catechumenatu decernere.",
	"In libro sexto, cum jam Monnica ipsius mater Mediolanum advenisset, ipseque annum aetatis ageret trigesimum; Ambrosii concionibus admonitus, catholicae doctrinae veritatem, quam Manichaei falso insimulabant, magis magisque intelligebat.",
	"Alypii amici sui mores prosequitur.",
	"In diversa rapiebatur, dum de vita melius instituenda deliberaret; mortis quoque ac judicii metu perculsus, ad vitae conversionem in dies accendebatur.",
	"In septimo libro exordium suae juventutis, id est annum aetatis trigesimum primum, ob mentis oculos reducit.",
	"Narrat se illa aetate densioribus adhuc ignorantiae tenebris involutum atque errantem circa Dei naturam, necnon circa originem mali, in cujus inquisitione se mirum in modum angebat, pervenisse tandem ad cognitionem Dei sinceram; quamvis nondum digne de Domino Christo sentiret.",
	"Aliud enim pro alio potest invocare nesciens te. An potius invocaris, ut sciaris?",
	"Quomodo autem invocabunt in quem non crediderunt?",
	"Et quomodo invocabo Deum meum, Deum et Dominum meum?",
	"Quoniam utique in me ipsum eum vocabo, cum invocabo eum. Et quis locus est in me quo veniat in me Deus meus?",
	"Quo Deus veniat in me, Deus qui fecit coelum et terram?",
	"Itane, Domine Deus meus, est quidquam in me quod capiat te?",
	"An vero coelum et terra quae fecisti, et in quibus me fecisti, capiunt te?",
	"An quia sine te non esset quidquid est, fit ut quidquid est capiat te?",
	"Quoniam itaque et ego sum, quid peto ut venias in me, qui non essem, nisi esses in me?",
	"Non enim ego jam in inferisTheoderic. Ms.: Ego sum inferi, non intoleranter.",
	"Inde in scholam datus sum ut discerem litteras, in quibus quid utilitatis esset ignorabam miser, et tamen si segnis in discendo essem, vapulabam.",
	"Estne quisquam, Domine, tam magnus animus, praegrandi affectu tibi cohaerens?",
	"Nulla enim verba illa noveram, et saevis terroribus ac poenis ut nossem instabatur mihi vehementer.",
	"Nam et latina aliquando infans utique nulla noveram; et tamen advertendo didici sine ullo metu atque cruciatu, inter etiam blandimenta nutricum, et joca arridentium, et laetitias alludentium.",
	"Didici vero illa sine poenali onere urgentium, cum me urgeret cor meum ad parienda concepta sua, quae non possemMss. aliquot cum Arn.: Et quia non esset nisi; alii nonnulli: et quae non nosset nisi.",
	"Non enim pedibus aut spatiis locorum itur abs te, aut reditur ad te.",
	"Quam tu secretus es, habitans in excelsis in silentio, Deus solus magnus, lege infatigabili spargens poenales caecitates super illicitas cupiditates!",
	"Cum homo eloquentiae famam quaerit, astans ante hominem judicem, circumstante hominum multitudine, inimicum suum odio immanissimo insectans, vigilantissime cavet ne per linguae errorem dicat, Inter hominibusLov., inter homines.",
	"Patet legendum esse cum Mss. inter hominibus; vel sine aspiratione, inter omines: quod Augustinus in exemplum affert locutionis incongruae et cavendae.",
	"Horum ego puer morum in limine jacebam miser, et hujus arenae palaestra erat illa, ubi magis timebam barbarismum facere, quam cavebam si facerem, non facientibus invidere.",
	"Dico haec et confiteor tibi, Deus meus, in quibus laudabar ab eis, quibus placere tunc mihi erat honeste vivere.",
	"Non enim videbam voraginem turpitudinis in quam projectus eram ab oculis tuis. Nam in illis jam quid me foedius fuit, ubi etiam talibus displicebam, fallendo innumerabilibus mendaciis et paedagogum, et magistros, et parentes amore ludendi, studio spectandi nugatoria, et imitandi ludicra inquietudine?",
	"Furta etiam faciebam de cellario parentum et de mensa, vel gula imperitante, vel ut haberem quod darem pueris, ludum suum mihi, quo pariter utique delectabantur, tamen vendentibus.",
	"Nam haec ipsa sunt quae a paedagogis et magistris, a nucibus, et pilulis, et passeribus, ad praefectos et reges, aurum, praedia, mancipia; haec ipsa omnino quae succedentibus majoribus aetatibus transeunt, sicuti ferulis majora supplicia succedunt.",
	"Bonus ergo est qui fecit me, et ipse est bonum meum, et illi exsulto bonis omnibus quibus etiam puer eram.",
	"Quippe hoc loco fatetur Augustinus se in eo peccasse, quod voluptates, sublimitates, veritates, non in Deo, sed in seipso et creaturis aliis quaereret.",
	"Ad aetatem aliam progreditur, primum quae adolescentiae suae, id est, sextum decimum vitae annum, quem in paterna domo studiis intermissis consumpserat genio ac libidinibus indulgens, ad mentem revocat cum gravi dolore, severus admodum in dijudicando furto a se tunc temporis cum sodalibus perpetrato."
]

var generate = {};
let nouns = shuffleArray(getWords(4));
let nouns_idx = 0;
let nouns_max = nouns.length;

let words = shuffleArray(getWords(2));
let words_idx = 0;
let words_max = words.length;

/*generate.name = function() {
	var name_1 = randomItem(firstnames);
	var name_2 = randomItem(firstnames);
	var name_3 = randomItem(lastnames);
	var out = name_1 + " " + name_2 + " " + name_3;
	return out;
};*/

generate.name = function() {
	let out = '';
	let n1 = capitalize(randomItem(nouns));
	let n2 = capitalize(randomItem(nouns));
	let n3 = capitalize(randomItem(nouns));
	let rand = Math.random();
	if(Math.random() > 0.5){
		out = n1 + ' ' + n2 + ' ' + n3;
	}
	else if(Math.random() > 0.8){
		out = n1 + ' ' + n2.charAt(0) + '. ' + n3;
	}
	else {
		out = n1 + ' ' + n3;
	}
	return out;
}

generate.noun = function() {
	if(nouns_idx == nouns_max-1){
		nouns_idx = 0;
	}
	else {
		nouns_idx++;
	}
	return nouns[nouns_idx];
}

generate.word = function() {
	if(words_idx == words_max-1){
		words_idx = 0;
	}
	else {
		words_idx++;
	}
	return nouns[words_idx];
}

generate.sentence = function(max=10, min=1, random_length=false){
	if(random_length) { max = Math.floor(Math.random()*max)+min}
	let out = capitalize(randomItem(words)) + ' ';
	for(let i=0; i<max-1; i++){
		out += randomItem(words) + ' ';
	}
	out = out.slice(0, -1);
	out += '.'
	return out;
}


generate.date = function(years=1){
	let time = Date.now();
	let offset = 1000 * 60 * 60 * 24 * 356 * years;
	time -= Math.floor(Math.random()*offset);
	return time;
}

generate.text = function(prop){
	let sentences_per_paragraps = prop?.sentences_per_paragraps?.random ? Math.ceil(Math.random()*prop?.sentences_per_paragraps?.num) : prop?.sentences_per_paragraps?.num || 3;
	let paragraphs = prop?.paragraphs?.random ? Math.ceil(Math.random()*prop?.paragraphs?.num) : prop?.paragraphs?.num || 3;
	let html = prop?.html ? prop?.html : false;

	let idx = 0;
	let max = ipsum.length-1;
	let ar = shuffleArray(ipsum, true);
	let out = '';

	for(let i=0; i<paragraphs; i++){
		let para = '';
		for(let n=0; n<sentences_per_paragraps; n++){
			let sen = '';
			if(prop?.randomize_words){
				sen = generate.sentence(25, 5, true) + ' ';
			}
			else {
				sen = ar[idx] + ' ';
			}
			
			para += sen;
			if(idx == max) { idx = 0;}
			else { idx++; }
		}
		if(html) {
			if(html.tags){
				para = addTags(para,'<strong>', '</strong>');
				para = addTags(para,'<i>', '</i>');
				para = addTags(para,'<a target="_blank" href="https://raum.com">', '</a>');
			}
			if(html.quotes && paragraphs > 1 && i > 0 && i != paragraphs && Math.random() < 0.1){
				para = '<blockquote>' + para + '</blockquote>';
			}
			else {
				para = '<p>' + para + '</p>'
			}
			if(html.subheadlines && paragraphs > 1 && Math.random() < 0.3){
				para = '<h4>' + generate.sentence(8,3,true) + '</h4>' + para;
			}
			if(html.lists && paragraphs > 1 && Math.random() < 0.1){
				let list = '<ul>';
				for(let l = 0; l < Math.floor(Math.random()*10)+1; l++){
					list += '<li>' + generate.sentence(3,2,true) + '</li>';
				}
				list += '</ul>';
				para += list;
			}

			if(html.tables && Math.random() < 0.2){
				let rand_col = Math.floor(Math.random()*2)+2;
				let rand_row = Math.floor(Math.random()*6)+2;
				let cwords = generate.words(rand_col);
				var table = '<table>';
				//table += `<caption>${generate.sentence(2,true)}</caption>`;
				
				table += '<thead>'
				table += '<tr>'
				for(let n=0; n<rand_col; n++){
					table += `<th>${capitalize(cwords[n]) + ' ' + (n+1)}</th>`;
				}
				table += '</tr>';
				table += '</thead>'

				table += '<tfoot>'
				table += '<tr>'
				for(let n=0; n<rand_col; n++){
					table += `<th>${capitalize(cwords[n]) + ' ' + (n+1)}</th>`;
				}
				table += '</tr>';
				table += '</tfoot>'

				table += '<tbody>'
				for(let i=0; i<rand_row; i++){
					table += '<tr>'
					for(let n=0; n<rand_col; n++){
						table += `<td>${generate.word()}</td>`;
					}
					table += '</tr>';
				}
				table += '</tbody>'
				table += '</table>'
				para += table;
			}
		}

		out += para + '\n\n';
	}
	if(html.headlines && Math.random() < 0.5){
		out = '<h1>' + generate.sentence(8,3,true) + '</h1>' + out;
	}
	return out;
}

function addTags(s, tag_start, tag_end, min_words=2, prop=0.3){
	let ar = s.split(' ');
	ar = ar.splice(0,ar.length-4);
	let word = randomItem(ar,4);
	let idx = find(s,word);
	let front = s.substr(0,idx) + tag_start;
	let back = s.substr(idx);
	idx = find(back, ' ', Math.floor(Math.random()*min_words)+min_words);
	back = back.substr(0, idx) + tag_end + back.substr(idx);
	let out = front + back;
	if(Math.random() > prop) { out = s};
	return out;
}



generate.words = function(num=5){
	let w = shuffleArray(words);
	if(num > words.length-1) { num = words.length-1}
	return w.splice(0,num);
}


function getWords(min_chars=5){
	let ar = ipsum;
	let out = [];
	for(let n=0; n<ar.length; n++){
		let w = ar[n].split(' ');
		for(let i=0; i<w.length; i++){
			let word = w[i].replace(/[^a-z0-9]/gi, '');
			word = word.toLowerCase();
			if(word.length > min_chars-1){
				out.push(word);
			}
		}
	}
	return [...new Set(out)];
}



function randomItem(ar,min=0){
	let out = '';
	for(let i=0; i<100; i++){
		out = ar[Math.floor(Math.random()*ar.length)];
		if(out.length > min){
			break;
		}
	}
	return out;
}

function shuffleArray(ar, clone=false){
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

function capitalize(str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

function find(s, seek, idx=1) {
  return s.split(seek, idx).join(seek).length;
}



export default generate;