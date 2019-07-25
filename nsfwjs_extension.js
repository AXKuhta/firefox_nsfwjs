// HOW TO ENABLE THE EXTENSION
// Open up the about:debugging page and add this extension as a temporary
// Select manifest.json in the file selection dialog
// You can then enable this extension for private tabs like you would with any other extension
//
// As of right now, it's tuned to work strictly on old.reddit.com
//


function round2Digits( number ) {
    return Math.round( Math.round( number * 1000 ) / 10 ) / 100;
}

function getNeutrality( predictionsArray ) {
	for (i=0; i<predictionsArray.length; i++ ) {
		if (predictionsArray[i].className == "Neutral") return predictionsArray[i].probability;
	}
	console.log('getNeutrality: was unable to find the Neutral class');
	return -1;
}

function sleep( ms ) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Function that waits for images to load
async function loadImage(src) {
	return new Promise((resolve, reject) => {
		let img = new Image();
		img.onload = () => resolve(img);
		img.crossOrigin = 'anonymous';
		img.src = src;
	})
}

async function getAllUncheckedImages() {
	// Create an array for all of the images, including the old and already checked ones
	var imgArray = new Array();
	
	// And create an array for the parent objects of the images
	var newParentArray = new Array();
	var newImageArray = new Array();
	
	// Query the images. This one is specific for reddit.
	imgArray = document.querySelectorAll('.thumbnail img, .preview');
	
	if (imgArray.length == 0) {
		throw new Error('No images found on this page. Stopping here.');
	}
	
	var newImageCounter = 0;
	
	// Here we check for new images
	// If there are any, we hide them and then add them to an array that the NSFWJS will be checking
	for (i=0; i<imgArray.length; i++) {
		if (imgArray[i].parentElement.classList.contains('nsfwjs_checked')) continue;
		if (imgArray[i].tagName == 'VIDEO') continue; // A hack to skip videos
		
		// Get a copy of the new image into a separate array
		newImageArray[newImageCounter] = await loadImage(imgArray[i].src);
		
		// Get a parent of the <img>. We'll be slapping text onto it
		newParentArray[newImageCounter] = imgArray[i].parentElement;
		
		// Hide the source image or object
		newParentArray[newImageCounter].style.visibility = 'hidden';
		
		newImageCounter++;
	}
	
	return {images: newImageArray, parents: newParentArray};
}

async function run_nsfwjs_recognition() {
	const nsfwjs = require('nsfwjs');
	
	nsfwjs.load(browser.extension.getURL('quant_nsfw_mobilenet/')).then(async model => {
		console.log('Model load OK');	
		
		while (1) {
			// Every 50ms check for new images
			// Probably not the best thing to do performance-wise
			await sleep(50);

			var newImages = await getAllUncheckedImages();
			
			var imageArray = newImages["images"];
			var parentArray = newImages["parents"];
			
			if (imageArray.length == 0) continue;
			
			console.log('Detected', imageArray.length, 'new images');

			var prediction_i = 0;
			
			for (i=0; i<parentArray.length; i++) {
				
				model.classify(imageArray[i]).then(predictions => {
					//console.log('Prediction for', imageArray[prediction_i].src, predictions);
					var text_note = '';
					
					if (getNeutrality(predictions) > 0.35) {
						// If the image is more than 35% neutral, unhide it
						parentArray[prediction_i].style.visibility = 'visible';
						console.log('Image', imageArray[prediction_i].src, 'is safe', (predictions[0].probability * 100 + "%"));
					} else {
						text_note += 'This image is NSFW!<br><br>';
						console.log('Image', imageArray[prediction_i].src, 'is UNSAFE! (' + predictions[0].className + ' ' + (predictions[0].probability * 100 + "%") + ')');
					}
					
					parentArray[prediction_i].classList.toggle('nsfwjs_checked');
					
					// Reddit specific image type check. Executes if image is a preview and not a thumbnail
					if (parentArray[prediction_i].parentElement.classList.contains('media-preview-content')) {
						text_note += (predictions[0].className + ' ' +(round2Digits(predictions[0].probability * 100) + "%") + '<br>');
						text_note += (predictions[1].className + ' ' +(round2Digits(predictions[1].probability * 100) + "%") + '<br>');
						text_note += (predictions[2].className + ' ' +(round2Digits(predictions[2].probability * 100) + "%") + '<br>');
						text_note += (predictions[3].className + ' ' +(round2Digits(predictions[3].probability * 100) + "%") + '<br>');
						text_note += (predictions[4].className + ' ' +(round2Digits(predictions[4].probability * 100) + "%") + '<br>');
						
						var text_paragraph = document.createElement('p');
						var text_node = document.createTextNode('');
						text_paragraph.appendChild(text_node);
						text_paragraph.innerHTML = text_note;
						text_paragraph.style.visibility = 'visible';
						text_paragraph.style.position = 'absolute';
						text_paragraph.style.top = '5px';
						text_paragraph.style.left = '5px';
						text_paragraph.style.color = '#FFFFFF';
						text_paragraph.style.textShadow = '1px 1px 4px #000000';
							
						parentArray[prediction_i].parentElement.appendChild(text_paragraph);
					}
					prediction_i++;
				})
			}
		}
	},
	model => {
		// Fail condition
		console.log('Failed to load the model: promise rejected.');
	})

}

// Here is where the execution starts
console.log("Loading nsfwjs. Check the main console (Ctrl + Shift + J) for errors. Firefox doesn't print extension errors to the tab console.");
run_nsfwjs_recognition();

