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
]);