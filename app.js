var walmartApp = angular.module('walmartApp', ['ngRoute', 'ngSanitize'])
    .run(function() {
        // Mitigates the 300ms tap-delay on certain mobile devices
        // https://github.com/ftlabs/fastclick
        FastClick.attach(document.body);
    });


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
    $scope.siteObj.apipKey = 'a25dnewg5yrpqpzuvhq3jk97';
});


walmartApp.controller('searchController', function($scope, $http) {
    $scope.searching = false;

    if ($scope.siteObj.results) {
        // If we have results in the cache then use them
        $scope.results      = $scope.siteObj.results;
        $scope.searchTerm   = $scope.siteObj.searchTerm;
        $scope.searchedTerm = $scope.siteObj.searchedTerm;
    }

    $scope.searchItems = function($event) {
        $scope.searching        = true;
        $scope.searchTermShort  = false;
        $scope.noResults        = false;

        // Drop focus on input to dismiss mobile keypads
        document.searchform.searchinput.blur();

        if ($scope.searchTerm.length < 3) {
            // Search term is too short
            $scope.searchTermShort  = true;
            $scope.searching        = false;
            return false;
        }

        var url = 'https://api.walmartlabs.com/v1/search?query=' + $scope.searchTerm + '&format=json&apiKey=' + $scope.siteObj.apipKey + '&numItems=20&sort=bestseller&callback=JSON_CALLBACK';

        $http.jsonp(url)
        .success(function(response) {
            $scope.searching            = false;
            $scope.searchedTerm         = $scope.searchTerm;
            $scope.results              = response;
            $scope.siteObj.results      = response;
            $scope.siteObj.searchTerm   = $scope.searchTerm;
            $scope.siteObj.searchedTerm = $scope.searchedTerm;
        });
    };
});


walmartApp.controller('itemController', function($scope, $http, $routeParams, $filter) {
    if ($scope.siteObj.results) {
        // If we have stored results, see if we can grab the item from the cache
        $scope.item = $filter('filter')($scope.siteObj.results.items, {itemId: $routeParams.itemId})[0];
    } else {
        // Otherwise go grab it fresh from the api
        $scope.fetching = true;
        var url = 'https://api.walmartlabs.com/v1/items/' + $routeParams.itemId + '?format=json&apiKey=' + $scope.siteObj.apipKey + '&callback=JSON_CALLBACK';

        $http.jsonp(url)
        .success(function(response) {
            $scope.fetching     = false;
            $scope.item         = response;
            $scope.siteObj.item = response;
        });
    }
    // Ensure scroll window to top
    document.body.scrollTop = document.documentElement.scrollTop = 0;
});


walmartApp.controller('reviewsController', function($scope, $http, $routeParams, $filter) {
    $scope.fetching = true;
    var url = 'https://api.walmartlabs.com/v1/reviews/' + $routeParams.itemId + '?format=json&apiKey=' + $scope.siteObj.apipKey + '&callback=JSON_CALLBACK';

    $http.jsonp(url)
    .success(function(response) {
        $scope.fetching = false;
        $scope.reviews = response;
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
