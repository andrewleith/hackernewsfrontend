'use strict';


// Declare app level module which depends on filters, and services
angular.module('newsreader', [ 'ngRoute', 'newsreader.services', 'newsreader.controllers']).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/getstories', {templateUrl: 'partials/list.html', controller: 'getStories'});
  $routeProvider.otherwise({redirectTo: '/view1'});
}]);


