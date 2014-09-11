  'use strict';

  /* Controllers */
  var module = angular.module('newsreader.controllers', []);

  module.controller('getStories', ['$scope', 'newsService', function($scope, newsService) {
    // $scope.stories = hackernewsService.getStories();


    // HTML elements and such
    var proxy = $("#proxy"),
      app = $("#flipapp"),
      pageElements = 'h1, h2, p, .headerlogo',
      tops = '.top:gt(0)',
      bottoms = $('.bottom:gt(0)'),
      images = $('img'),
      storyPane = $('#currentStory'),
      screenHeight = $(window).height(),
      screenWidth =  $(window).width(),
      screenWidthMax = 530;

    // variables for flippy logic
    var velocity, 
        currentStory = 0,
        nextStory = 0,
        currentY = 0,
        swipeDirection,
        initialSwipeDirection,
        _currentTop, _currentBottom, _shadowTop, _shadowBottom,
        startY = 180, lastY,
        inStory = false;

    

    TweenLite.set(storyPane, { x: screenWidth }); 
    TweenLite.set('#loading i', { lineHeight: screenHeight + 'px'}); // make the loading icon centered

    /// Split pages into two panes for flipping
    function createPages(stories) {    
      CSSPlugin.defaultTransformPerspective = 5000;
      var generatedHTML = "";

      // put 3 stories on each page
      var pages = [],
          pageColors = [['#2ecc71', '#ffffff'],['#e74c3c', '#ffffff'],['#3498db', '#ffffff']],
          count = 0;
      for (var i = 0; i < stories.length; i++) {
        var story,
            pageHtml = '';

        //TODO use a template system.. how to do  this in angular?
        
        pageHtml += '<div class="screen">';
        for (var j = 0; j < 4; j++) {
          if (i+j === stories.length)
            break;

          story = stories[i + j];
          pageHtml += '<div class="story" data-href="' + story.title.href + '">';
          pageHtml += '<div class="loader"></div>';
          pageHtml += '<div class="story-inner">';
          pageHtml += '<h1>' + story.title.text + '</h1><h2>' + story.domain + '</h2>';
          pageHtml += '<div class="comments pull-left">' + story.comments.text + ' / </div>';
          pageHtml += '<div class="points">' + story.points + '</div>';
          pageHtml += '</div></div>'
        }
        i += 3;
        pageHtml += '</div>';

        pages[count] = pageHtml;
        count++;
      }

      // static intro page top
      generatedHTML += '<div class="top page intro' + '" id="top0"><div class="overlay"></div><div class="screen"><div class="headerlogo">HN</div><h1><br /><span class="glyphicon glyphicon-circle-arrow-up"></span><br/><br/><br/>Swipe up to read stories</h1></div></div>';

      // print tops first in order to ensure stacking works correctly
      for (var i = 0; i < pages.length; i++) {
        generatedHTML += '<div class="top page" id="top' + (i+1) + '"><div class="overlay"></div>';
        generatedHTML += pages[i];
        generatedHTML += '</div>';
      }

      // print the bottoms in reverse order to ensure stacking works correctly
      for (var i = pages.length-1; i >= 0; i--) {
        generatedHTML += '<div class="bottom page" id="bottom' + (i+1) + '"><div class="overlay"></div>';
        generatedHTML += pages[i];
        generatedHTML += '</div>';
      }

      // static intro page bottom
      generatedHTML += '<div class="bottom page intro' + '" id="bottom0"><div class="overlay"><div class="screen"><div class="headerlogo">HN</div><h1><br /><span class="glyphicon glyphicon-circle-arrow-up"></span><br/><br/><br/>Swipe up to read stories</h1></div></div>';
      app.append(generatedHTML);
      
      TweenLite.set($(pageElements), { opacity: 0 });// hide app til some data is loaded

      // create flipboard
      Draggable.create(proxy, {
        // minY: 0,
        type:'y',
        throwProps: false,
        trigger: app,
        onDrag: rotate,
        onThrowUpdate: rotate, 
        edgeResistance:1,
        lockAxis:true,
        throwResistance:1000,
        // maxDuration: 0.3,
        ease:Power4.easeOut,
        onClick: function() {
            
            var whichClick = 0,
                story,
                text,
                iframe;

            if (!inStory && currentStory != 0) {
              if (this.pointerY >= 0 && this.pointerY < screenHeight/4) {
                story = $('#top' + currentStory).find('.story:eq(0)');
              }
              else if (this.pointerY >= screenHeight/4 && this.pointerY < 2*(screenHeight/4)) {
                story = $('#top' + currentStory).find('.story:eq(1)');
              }
              else if (this.pointerY >= 2*(screenHeight/4) && this.pointerY < 3*(screenHeight/4)) {
                story = $('#bottom' + currentStory).find('.story:eq(2)');
              }
              else if (this.pointerY >= 3*(screenHeight/4)) {
                story = $('#bottom' + currentStory).find('.story:eq(3)');
              }

              text = story.find('.story-inner');
              iframe = '<iframe width="100%" height="100%" src="' + story.data('href') + '"></iframe>';

              new TimelineLite({
                tweens: [
                  TweenLite.to(story, 0.25, {backgroundColor: 'rgba(0,0,0,0.15)', boxShadow: 'inset 1px 1px 40px rgba(0,0,0, 0.25)'}),
                  TweenLite.to(text, 0.25, {scale: 0.95}),
                  //TweenLite.to(story.find('.loader'), 2, { x: -20})
                ]
              }).play(0);

              window.open(story.data('href'));
              return;
              storyPane.find('#content').html(iframe);

              // storyPane.find('iframe').on('load', function() {
                TweenLite.to(storyPane, 0.5, { delay: 2, x: 0});
              // });
              
              inStory = true;
            }

        },
        onPress: function() {
          lastY = this.y;
        },
        onDragStart: function() {

          if (lastY > this.y) {
              initialSwipeDirection = 'up'; 
              _currentTop = $('#top' + (currentStory + 1));
              _currentBottom = $('#bottom' + currentStory);
              _shadowTop = $('#top' + (currentStory));
              _shadowBottom = $('#bottom' + (currentStory + 1)); 

              if (currentStory === 0)
                TweenLite.set(['#top1 .container, #bottom1 .container'], { opacity: 0, scale: 0.75});             
          }
          else {
            initialSwipeDirection = 'down';
            _currentTop = $('#top' + (currentStory));
            _currentBottom = $('#bottom' + (currentStory - 1));
            _shadowTop = $('#top' + (currentStory - 1));
            _shadowBottom = $('#bottom' + (currentStory));
          }

          TweenLite.to([_currentTop.find('.overlay'), _currentBottom.find('.overlay')], 0.25, { backgroundColor: 'rgba(0,0,0, 0.055)'});
          TweenLite.to(_currentBottom, 0.5, {boxShadow: '0px 5px 30px 0px rgba(0, 0, 0, 0.25)'});

          console.log('current story:' + currentStory);
          console.log(_currentTop);
          console.log(_currentBottom);
        },
        onDragEnd: function() {
            if (swipeDirection == 'up') {
              console.log('snap to top');
              TweenLite.to(_currentBottom, 0.35, {rotationX: 180});
              TweenLite.to(_currentTop, 0.35, {rotationX: 0});

              if (currentStory === 0)
                TweenLite.to(['#top1 .container, #bottom1 .container'], 0.45, { scale: 1, opacity: 1});

              if (initialSwipeDirection == swipeDirection && currentStory < stories.length)
                currentStory++;
            }
            else {
              console.log('snap to bottom');
              TweenLite.to(_currentBottom, 0.35, {rotationX: 0});
              TweenLite.to(_currentTop, 0.35, {rotationX: -180});

              if (initialSwipeDirection == swipeDirection && currentStory > 0)
                currentStory--;
            }

            TweenLite.to([_currentTop.find('.overlay'), _currentBottom.find('.overlay')], 0.25, { backgroundColor: 'rgba(0,0,0, 0)'});
            TweenLite.to(_shadowBottom.find('.overlay'), 0, { backgroundColor: 'rgba(0,0,0, 0)'});
            TweenLite.to(_shadowTop.find('.overlay'), 0.3, { backgroundColor: 'rgba(0,0,0, 0)'});
            TweenLite.set(_currentBottom, {boxShadow: 'none'});
            TweenLite.set(proxy, {y: startY});
        },
        onThrowComplete: function() {
          TweenLite.set(proxy, {y: startY });
          
        }
        //rotate first screen's bottom up then down with a bounce

      });

      $('#back').on('click', function() {
        var storyTop = $('#top' + currentStory),
            storyBottom = $('#bottom' + currentStory);

        TweenLite.set([storyTop.find('.story'), storyBottom.find('.story')], { clearProps: 'backgroundColor', boxShadow: 'none'});
        TweenLite.set([storyTop.find('.story-inner'), storyBottom.find('.story-inner')], { scale: 1});
        TweenLite.set([storyTop.find('.loader'), storyBottom.find('.loader')], { x: -1* screenWidth - 20});

        new TimelineLite({
          tweens: [
            TweenLite.to(storyPane, 0.5, { x: screenWidth})
          ],
          onComplete: function() {
            storyPane.find('#content').html('');    
          }
        })
        inStory = false;

        
      });

      TweenLite.set(proxy, { y: startY}); 
      $('.bottom').scrollTop(screenHeight/2); // align halves 
      TweenLite.set(tops, { rotationX: -180, force3D:true, rotationY: 0 }); // hide all tops but the first one
      TweenLite.set('.page', { height: screenHeight/2}); // fix their heights to make the flip work
      TweenLite.set('.bottom', { top: screenHeight/2 }); // position the bottom explicitly so there is no 1px white line between top and bottom on my iphone (worked fine in chrome)
      TweenLite.set('#bottom0', { boxShadow: '0px 25px 30px 0px rgba(0, 0, 0, 0.25)' }); // TODO: move this to css
      TweenLite.set('.loader', { x: -1*screenWidth - 20});

      // force headlines to be a max of two lines
      $('h1').not(':first').not(':last').each(function() {
        $clamp($(this)[0], 2);
      });

      // center pages vertically
      // $('.page .screen').each(function() {
      //   var page = $(this);
      //   TweenLite.set(page, {marginTop: (screenHeight - page.height())/2});
      // });


      
      // divide page into 4, center each piece
      $('.story').each(function() {
        var story = $(this);
        var margin = ((screenHeight/4) - story.height()) / 2;

        TweenLite.set([story, $('.loader')], { height: screenHeight/4, paddingTop: margin, paddingBottom: margin});
      });
      
      // fade in images
      // var imagesLoaded = 0, 
      //     imagesTotal = $('img').length;
      // $('img').each(function(i) {
      //   var currentImage = $(this);
      //   if (i < 3) {
      //     currentImage.attr('src', currentImage.attr('xsrc'))

      //     currentImage.on('load', function() {
      //       imagesLoaded++;
      //       TweenLite.to(currentImage, 0.45, { opacity: 1 });
      //       if (imagesLoaded == 3) { // all images are loaded fade in the app
      //         $('.bottom').scrollTop(screenHeight/2); // align halves 
      //         //rotate first screen's bottom up then down with a bounce
      //         var openingSequence = new TimelineLite({
      //           align: 'sequence',
      //           tweens: [
      //             TweenLite.to('#loading i', 0.25, { autoAlpha: 0 }),
      //             TweenLite.to(app, 0.75, { autoAlpha: 1 }), // fade in app
      //             TweenLite.to('#bottom0 h1', 0.5, { opacity: 1 }),
      //             new TimelineLite({ tweens: [
      //               TweenLite.to('#bottom0', 0.4, {  rotationX: 65 }),
      //               TweenLite.to('#bottom0 .overlay', 0.5, { backgroundColor: 'rgba(0,0,0, 0.075)'}),
      //             ]}),
      //             new TimelineLite({ tweens: [
      //               TweenLite.to('#bottom0', 0.5, { rotationX: 0, ease:Bounce.easeOut }),
      //               TweenLite.to('#bottom0 .overlay', 0.25, { backgroundColor: 'rgba(0,0,0, 0)'})
      //             ]})
      //           ],
      //           onComplete: function() {
      //             $('img').each(function(i) {
      //               var currentImage = $(this);
      //               if (i >= 3) {
      //                 currentImage.attr('src', currentImage.attr('xsrc'));
      //                 currentImage.on('load', function() {
      //                   TweenLite.to(currentImage, 0.45, { opacity: 1 });
      //                 });
      //               }
      //             });
      //           }
      //         }).play(0);
      //       }
      //     });
      //   }

      var openingSequence = new TimelineLite({
        align: 'sequence',
        tweens: [
          // new TimelineLite({ tweens: [
            TweenLite.to('#loading', 0.50, { autoAlpha: 0 }),
            TweenLite.to($(pageElements), 0.75, { autoAlpha: 1 }), // fade in app
          // ]}),
          TweenLite.to('#bottom0 h1', 0.5, { opacity: 1 }),
          new TimelineLite({ tweens: [
            TweenLite.to('#bottom0', 0.4, {  rotationX: 65 }),
            TweenLite.to('#bottom0 .overlay', 0.5, { backgroundColor: 'rgba(0,0,0, 0.075)'}),
          ]}),
          new TimelineLite({ tweens: [
            TweenLite.to('#bottom0', 0.5, { rotationX: 0, ease:Bounce.easeOut }),
            TweenLite.to('#bottom0 .overlay', 0.25, { backgroundColor: 'rgba(0,0,0, 0)'})
          ]})
        ]
      }).play(0);

      function rotate() {

        var bottomValue, topValue, shadowValue;

        shadowValue = 0.15;

        if (lastY > this.y)
          swipeDirection = 'up';
        else
          swipeDirection = 'down';

        if (initialSwipeDirection === 'up') {
          bottomValue = startY - this.y;
          topValue = startY - this.y - 180;
          // shadowValue = (bottomValue / 180)*0.5;
        }
        else {
          bottomValue = 180 + startY - this.y;
          topValue = startY - this.y;
          // shadowValue = (-1*topValue / 180)*0.5;
        }

        TweenLite.set(_currentBottom, {rotationX: bottomValue});
        TweenLite.set(_currentTop, {rotationX: topValue});
        lastY = this.y;
        
        // shade next pages on flip
        if (initialSwipeDirection == 'up') {
          if (bottomValue < 90) {
            TweenLite.to(_shadowBottom.find('.overlay'), 0.2, { backgroundColor: 'rgba(0,0,0, ' + shadowValue + ')'});
            TweenLite.to(_shadowTop.find('.overlay'), 0.2, { backgroundColor: 'rgba(0,0,0, 0)'});
          }
          else { 
            TweenLite.to(_shadowTop.find('.overlay'), 0.2, { backgroundColor: 'rgba(0,0,0, ' + shadowValue + ')'});
            TweenLite.to(_shadowBottom.find('.overlay'), 0.2, { backgroundColor: 'rgba(0,0,0, 0)'});
          }
        } 
        else {
          if (bottomValue > 90)  {
            TweenLite.to(_shadowTop.find('.overlay'), 0.2, { backgroundColor: 'rgba(0,0,0, ' + shadowValue + ')'});
            TweenLite.to(_shadowBottom.find('.overlay'), 0.2, { backgroundColor: 'rgba(0,0,0, 0)'});
          }
          else {
            TweenLite.to(_shadowBottom.find('.overlay'), 0.2, { backgroundColor: 'rgba(0,0,0, ' + shadowValue + ')'});
            TweenLite.to(_shadowTop.find('.overlay'), 0.2, { backgroundColor: 'rgba(0,0,0, 0)'});
          }
        }
        console.log('bot: ' + bottomValue);
        console.log('top: ' + topValue);
        console.log('sha: ' + shadowValue);
      }
    }
    
    
    // newsService.getHNStories(createPages); 
    newsService.getHNKimono(createPages);
  }]);
