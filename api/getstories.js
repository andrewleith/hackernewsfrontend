var get = require('./js-server/get');
var scrape = require('./js-shared/dom-scraper');
var $ = require('cheerio');
var util = require('util');
var express = require('express');
var app = express();
/// Gets a list of all stories on https://news.ycombinator.com/.
app.get('/listings', function(req, res) {

    var options = {"doc_synopsis":"Gets a list of all stories on https://news.ycombinator.com/.","verb":"GET","outputMappings":{"title":{"selector":"a","accessor":"text","doc_description":"Title of story on hackernews"},"link":{"selector":"a","accessor":["attr",["href"]],"doc_description":"Title of story on hackernews"}},"target":{"url":"https://news.ycombinator.com/","verb":"GET","rowSelector":"td.title"}};
   
    // map method params to target site's query string params [TODO: support more ways of mapping params (post, routes, whatever)]
    if (options.inputMappings) {
        for (var param in req.query) {
            options.url += options.inputMappings[param] + '=' + req.query[param] + '&';
        }            
    }
    
    get(options.target.url, function(data) {

        var scrapedData = scrape($, data, options.target.rowSelector, options.outputMappings);
        res.json(scrapedData);
    });
});

app.listen(3000);
console.log('ScrAPI started on port 3000');