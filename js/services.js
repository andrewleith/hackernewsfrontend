'use strict';

/* Services */

angular.module('newsreader.services', []).
  factory('newsService', ['$http', function($http) {

	var API = {};

	API.get = function(url,  callback) {
		// TODO: use angular's version of this instead (if there is one)
	    $.getJSON("http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%3D%22" + encodeURIComponent(url) + "%22&format=xml'&callback=?", function (data) {
	        if (data.results[0]) {
	        	var removeStuff = data.results[0].replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');//.replace(/src=\"/g, 'xsrc="');
	            callback(removeStuff); // scrape
	        } else {
	            callback({});
	        }
	    });
	};
	
	var scrape = function($, data, rowSelector, outputMappings, callback) {
		var rows = [],
			rowCount = $(rowSelector, data).length;

		// var stories = [1,2,3,4,5]; // will come from service
		// var mappings = { 'title': 'a'};


		// var items = [];
		// var count = 0, num = stories.length;
		// $(stories).each(function (i) {
		// 	var row = {};
		// 	var story = stories[i];

		// 	for (var col in outputMappings) {
		// 		var selector = outputMappings[col].selector,
		//            	accessor = outputMappings[col].accessor;


		// 	}

		// 	setTimeout(function() {
		// 		items.push(i);
		// 		count++;

		// 		if (count == num)
		// 			console.log('END:' + i + ' - ' + items );
		// 		else
		// 			console.log('not end: ' + i);

		// 	}, (i == 1 ? 4000 : 0));
		// });


		//return;

		// remove image tag src attribute to prevent browser from loading the images (or failing to) when data is examined with jquery
		
		$(rowSelector, data).each(function (i, elem) {
		    var row = {},
		        lastId,
		        pushRow = false,
		        colCount = outputMappings.length,
		        colsRead = 0;

		    for (var col in outputMappings) {
		    	// console.log('getting ' + col);

		        var selector = outputMappings[col].selector,
		        	accessor = outputMappings[col].accessor,
		        	data,
		        	obj;

		        // if the accessor is an array, run the first argument as a function and the rest as params
		        if (accessor instanceof Array) {
		            obj = $(this).find(selector);
		            data = obj[accessor[0]].apply(obj, accessor[1]); //["attribs.href"]; 
		            colsRead++;
		        }
		      //   else if (col === 'imgUrl'){
		      //   	// console.log(row['link'])
		      // //   	if (typeof row['link'] !== 'undefined' && row['link']) {
			     //  		// API.get(row['link'], function(getdata) {
				    //    //    var img = $('img', getdata).filter(function() { 
				    //    //      var image = new Image();
				    //    //      image.src = $(this).attr('src');

				    //    //      return (image.width > 150) 
				    //    //    })[0];
				          
				    //    //    colsRead++;
				          
				    //    //    if (typeof img !== 'undefined' && img)
				    //    //    	data = img.src;

				    //    //    if (colsRead == colCount) {	
				    //    //      if (typeof data !== 'undefined' && data) {
				    //    //          pushRow = true;
				    //    //          row[col] = data;
				    //    //      }
				    //    //      // console.log('row read:' + row);
				    //    //    }
			     //    // 	});
			     //    // }
		      //   }
		        else {
		            data = $(this).find(selector)[accessor](); //["attribs.href"]; 
		            colsRead++;
		        }

		        if (typeof data !== 'undefined' && data) {
		            pushRow = true;
		            row[col] = data;
		        }
		    }

		    // console.log("----");

		    if (pushRow) {
		        rows.push(row);
		    }
		    
		    pushRow = false;
		});

		callback(rows);
	};

	// /// Gets a list of all stories on https://news.ycombinator.com/.
	API.getHNStories = function(callback) {
		var options = {  
		   'doc_synopsis':'Gets a list of all stories on https://news.ycombinator.com/.',
		   'verb':'GET',
		   'outputMappings':{  
		      'title':{  
		         'selector':'a',
		         'accessor':'text',
		         'doc_description':'Title of story on hackernews'
		      },
		      'link':{  
		         'selector':'a',
		         'accessor':[  
		            'attr',
		            [  
		               'href'
		            ]
		         ],
		         'doc_description':'Title of story on hackernews'
		      },
		      'domain':{  
		         'selector':'span.comhead',
		         'accessor':'text',
		         'doc_description':'Domain of story'
		      },

		   },
		   'target':{  
		      'url':'https://news.ycombinator.com/',
		      'verb':'GET',
		      'rowSelector':'td.title'
		   }
		};


		// $http.get('http://localhost:3000/listings').success(function(data, status, headers, config) {
		// 	callback(data);
		// });
		// return;
		// API.get(options.target.url, '', function(data) {
		// 	scrape($, data, options.target.rowSelector, options.outputMappings, callback);
		// });

		API.get(options.target.url, function(data) {
			scrape($, data, options.target.rowSelector, options.outputMappings, function(scrapedData) {

				var scrapedItemsCount = scrapedData.length - 1;
				var modifiedItems = 0;
				$.each(scrapedData, function(i, elem) {

					API.get(scrapedData[i].link, function(data) {
						modifiedItems++;
						scrapedData[i].firstContent = $('h1:first', data).text();
						if (modifiedItems == scrapedItemsCount)
							callback(scrapedData);		
					});
				});
	
			});
		});
	};

	API.getHNKimono = function(callback) { 
	  $.getJSON("https://www.kimonolabs.com/api/d5q1froe?apikey=7TvJ0fmTTI0hvl8yRL8hwx3v85dfcojG", function (data) {
         callback(data.results.collection1);
      });
	};

	return API;

  }]);

