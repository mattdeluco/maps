/**
 * Created by mdeluco on 2014-08-02.
 */
'use strict';

angular.module('maps', [])

.controller('MapsCtrl', [
    '$scope',
    '$timeout',
    function ($scope, $timeout) {

        var clickTimeout,
            routingListenerId,
            mapOptions = {
                center: new google.maps.LatLng(46.5220, -84.3451),
                zoom: 15,
                disableDoubleClickZoom: true
            },
            map = new google.maps.Map($('#map-canvas')[0], mapOptions),
            directions = new google.maps.DirectionsService(),
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

        $scope.startRouting = function (mapRoute) {

            $scope.misc.routing = true;

            map.setOptions({draggableCursor: 'crosshair'});

            routingListenerId = google.maps.event.addListener(map, 'dblclick', function (e) {
                $timeout.cancel(clickTimeout);

                if (!mapRoute) {
                    mapRoute = new MapRoute(e.latLng, map, directions);
                    mapRoutes.push(mapRoute);
                } else {
                    mapRoute.mapRoute.append(e.latLng).then(function () {
                        $scope.$digest();
                    });
                }
            });

        };

        $scope.finishRouting = function (route) {
            map.setOptions({draggableCursor: 'auto'});
            // TODO Is there a better way to do this than mocking a MouseEvent object?  Possible to create MouseEvent?
            // I guess it's ok, since the handler only expects an object with "latLng" property?
            // But what if I want stop()?
            google.maps.event.trigger(map, 'dblclick', {latLng: route.mapRoute.legs[0].marker.getPosition()});
            google.maps.event.removeListener(routingListenerId);
            $scope.misc.latLng = map.getCenter();
            route.currentRoute = false;
            $scope.misc.routing = false;
        };

        $scope.undoLastLeg = function (route) {
            route.mapRoute.popLeg();
        };

        $scope.deleteRoute = function (route) {
            route.mapRoute.clear();
            _.remove($scope.misc.routes, route);
            if (route.currentRoute) {
                $scope.misc.latLng = map.getCenter();
                $scope.misc.routing = false;
            }
        };

    }
]);