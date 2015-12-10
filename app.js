var walmartApp = angular.module('walmartApp', ['ngRoute', 'ngSanitize']);


walmartApp.config(function($routeProvider) {
    $routeProvider
        .when('/', {
            templateUrl : 'search.html',
            controller  : 'searchController'
        })
        .when('/item/:itemId', {
            templateUrl : 'item.html',
            controller  : 'itemController'
        })
        .when('/item/:itemId/reviews', {
            templateUrl : 'reviews.html',
            controller  : 'reviewsController'
        });
});


walmartApp.controller('siteController', function($scope) {
    // Using this as a store for some state
    // There's probably a better way to do this
    $scope.siteObj = {};
});


walmartApp.controller('searchController', function($scope, $http) {
    $scope.searching = false;

    if ($scope.siteObj.results) {
        // If we have results in the cache then use them
        $scope.results      = $scope.siteObj.results;
        $scope.searchTerm   = $scope.siteObj.searchTerm;
        $scope.searchedTerm = $scope.siteObj.searchedTerm;
    }

    $scope.searchItems = function() {
        $scope.searching        = true;
        $scope.searchTermShort  = false;
        $scope.noResults        = false;

        if ($scope.searchTerm.length < 3) {
            // Search term is too short
            $scope.searchTermShort  = true;
            $scope.searching        = false;
            return false;
        }

        var url = 'http://api.walmartlabs.com/v1/search?query=' + $scope.searchTerm + '&format=json&apiKey=a25dnewg5yrpqpzuvhq3jk97&numItems=20&sort=bestseller&callback=JSON_CALLBACK';

        $http.jsonp(url)
        .success(function(response) {
            $scope.searching            = false;
            $scope.searchedTerm         = $scope.searchTerm;
            $scope.results              = response;
            $scope.noResults            = response.totalResults == 0;
            $scope.siteObj.results      = response;
            $scope.siteObj.searchTerm   = $scope.searchTerm;
            $scope.siteObj.searchedTerm = $scope.searchedTerm;
        });
    };
});


walmartApp.controller('itemController', function($scope, $http, $routeParams) {
    if ($scope.siteObj.item && $scope.siteObj.item.itemId == $routeParams.itemId) {
        // Grab the item from cache if it's there
        $scope.item = $scope.siteObj.item;
    } else {
        // Otherwise go grab it from the api
        $scope.fetching = true;
        var url = 'http://api.walmartlabs.com/v1/items/' + $routeParams.itemId + '?format=json&apiKey=a25dnewg5yrpqpzuvhq3jk97&callback=JSON_CALLBACK';

        $http.jsonp(url)
        .success(function(response) {
            $scope.fetching     = false;
            $scope.item         = response;
            $scope.siteObj.item = response;
        });
    }
});


walmartApp.controller('reviewsController', function($scope, $http, $routeParams, $filter) {
    $scope.fetching = true;
    var url = 'http://api.walmartlabs.com/v1/reviews/' + $routeParams.itemId + '?format=json&apiKey=a25dnewg5yrpqpzuvhq3jk97&callback=JSON_CALLBACK';

    $http.jsonp(url)
    .success(function(response) {
        $scope.fetching = false;
        $scope.reviews = response;
        console.log(response);
    });
});


walmartApp.filter('trusted', ['$sce', function($sce) {
    // We're using this to unescape certain responses from the api
    // such as item.shortDescription and item.longDescription
    var div = document.createElement('div');
    return function(text) {
        div.innerHTML = text;
        return $sce.trustAsHtml(div.textContent);
    };
}])