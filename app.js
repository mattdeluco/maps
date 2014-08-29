/**
 * Created by mdeluco on 2014-08-02.
 */
'use strict';

angular.module('maps', [])

.factory('MapsFactory', [
    function () {

        var map,
            directions = new google.maps.DirectionsService();

        return {
            createMap: function (mapDiv, mapOptions) {
                if (!map) {
                    map = new google.maps.Map(mapDiv, mapOptions || {});
                }
                return map;
            },
            directions: directions
        }
    }
])

.controller('MapRouteCtrl', [
    '$scope',
    '$timeout',
    'MapsFactory',
    function ($scope, $timeout, maps) {

        var clickTimeout,
            routingListenerId,
            mapOptions = {
                center: new google.maps.LatLng(46.5220, -84.3451),
                zoom: 15,
                disableDoubleClickZoom: true
            },
            map = maps.createMap($('#map-canvas')[0], mapOptions),
            directions = maps.directions,
            mapRoutes = [];

        $scope.routes = mapRoutes;
        $scope.misc = {
            latLng: map.getCenter(),
            routing: false
        };

        google.maps.event.addListener(map, 'click', function (e) {
            clickTimeout = $timeout(function () {
                map.panTo(e.latLng);
                $scope.$apply(function () {
                    $scope.misc.latLng = e.latLng;
                });
            }, 200);
        });

        $scope.startRouting = function (route) {

            $scope.misc.routing = true;
            map.setOptions({draggableCursor: 'crosshair'});

            if (!route) {
                route = {route: new MapRoute(map, directions)};
                mapRoutes.push(route);
            }

            route.currentRoute = true;
            route.visible = true;

            routingListenerId = google.maps.event.addListener(map, 'dblclick', function (e) {
                $timeout.cancel(clickTimeout);
                route.route.append(e.latLng).then(function () {
                    $scope.$digest();
                });
            });

        };

        $scope.finishRouting = function (route) {
            map.setOptions({draggableCursor: 'auto'});
            // TODO Is there a better way to do this than mocking a MouseEvent object?  Possible to create MouseEvent?
            // I guess it's ok, since the handler only expects an object with "latLng" property?
            // But what if I want stop()?
            google.maps.event.trigger(map, 'dblclick', {latLng: route.route.head.marker.getPosition()});
            google.maps.event.removeListener(routingListenerId);
            $scope.misc.latLng = map.getCenter();
            $scope.misc.routing = false;
            route.currentRoute = false;
        };

        $scope.undoLastLeg = function (route) {
            route.route.pop();
        };

        $scope.deleteRoute = function (route) {
            route.route.clear();
            _.remove($scope.routes, route);
            if (route.currentRoute) {
                $scope.misc.latLng = map.getCenter();
                $scope.misc.routing = false;
            }
        };

        $scope.visibleChanged = function (route) {
            if (route.visible) {
                route.route.show();
            } else {
                route.route.hide();
            }
        };

    }
])

.controller('PlacesCtrl', [
    '$scope',
    'MapsFactory',
    function ($scope, maps) {
        var map = maps.createMap($('#map-canvas')[0]),
            autocomplete = new google.maps.places.Autocomplete($('#places-autocomplete-input')[0], {
                bounds: map.getBounds(),
                componentRestrictions: {country: 'ca'},
                types: ['establishment']
            }),
            placesSrvc = new google.maps.places.PlacesService(map);

        $scope.toggleMarker = function (marker, visible) {
            visible = visible || !marker.getMap();
            if (visible) {
                marker.setMap(map);
            } else {
                marker.setMap(null);
            }
        };

        $scope.search = function (keyword, searchOptions) {
            searchOptions = _.extend({
                key: mapsApp.config.google_api_key,
                radius: 5000,
                keyword: keyword,
                location: map.getCenter()
            }, searchOptions || {});

            placesSrvc.nearbySearch(searchOptions, function (placeResults, status) {
                if (status !== google.maps.places.PlacesServiceStatus.OK) {
                    // TODO
                } else {
                    var results = placeResults.slice(0, 10),
                        places = [];

                    $scope.places = places;

                    for (var i = 0; i < results.length; i++) {
                        places.push({
                            place: results[i],
                            marker: new google.maps.Marker({position: results[i].geometry.location})
                        });
                    }

                    $scope.$digest();
                }
            });
        };
    }
]);