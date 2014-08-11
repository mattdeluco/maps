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
            currentRoute;

        $scope.misc = {
            latLng: map.getCenter(),
            routes: [],
            currentRoute: null
        };

        google.maps.event.addListener(map, 'click', function (e) {
            clickTimeout = $timeout(function () {
                map.panTo(e.latLng);
                $scope.$apply(function () {
                    $scope.misc.latLng = e.latLng;
                });
            }, 200);
        });

        var routingListener = function (e) {
            $timeout.cancel(clickTimeout);
            currentRoute.addLeg(e.latLng).then(function () {
                $scope.$digest();
            });
        };

        $scope.startRouting = function (route) {
            currentRoute = route || new MapRoute(map, directions);
            $scope.misc.currentRoute = currentRoute;
            if (!route) {
                $scope.misc.routes.push({mapRoute: currentRoute});
            }
            map.setOptions({draggableCursor: 'crosshair'});
            routingListenerId = google.maps.event.addListener(map, 'dblclick', routingListener);
        };

        $scope.finishRouting = function () {
            map.setOptions({draggableCursor: 'auto'});
            // TODO Is there a better way to do this than mocking a MouseEvent object?  Possible to create MouseEvent?
            // I guess it's ok, since the handler only expects an object with "latLng" property?
            // But what if I want stop()?
            google.maps.event.trigger(map, 'dblclick', {latLng: currentRoute.legs[0].marker.getPosition()});
            google.maps.event.removeListener(routingListenerId);
            currentRoute = null;
            $scope.misc.currentRoute = null;
            $scope.misc.latLng = map.getCenter();
        };

        $scope.undoLastLeg = function () {
            currentRoute.popLeg();
        };

    }
]);