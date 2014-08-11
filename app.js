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
            route;

        $scope.misc = {
            title: 'Maps',
            latlng: {
                lat: map.getCenter().lat(),
                lng: map.getCenter().lng()
            },
            distance: 0
        };

        google.maps.event.addListener(map, 'click', function (e) {
            clickTimeout = $timeout(function () {
                map.panTo(e.latLng);
                $scope.$apply(function () {
                    $scope.misc.latlng = {
                        lat: e.latLng.lat(),
                        lng: e.latLng.lng()
                    };
                });
            }, 200);
        });

        var routingListener = function (e) {
            $timeout.cancel(clickTimeout);
            route.addLeg(e.latLng).then(function (d) {
                $scope.$apply(function () { $scope.misc.distance = d; });
            });
        };

        $scope.startRouting = function () {
            route = new MapRoute(map, directions);
            map.setOptions({draggableCursor: 'crosshair'});
            routingListenerId = google.maps.event.addListener(map, 'dblclick', routingListener);
        };

        $scope.finishRouting = function () {
            map.setOptions({draggableCursor: 'auto'});
            // TODO Is there a better way to do this than mocking a MouseEvent object?  Possible to create MouseEvent?
            // I guess it's ok, since the handler only expects an object with "latLng" property?
            // But what if I want stop()?
            google.maps.event.trigger(map, 'dblclick', {latLng: route.legs[0].marker.getPosition()});
            google.maps.event.removeListener(routingListenerId);
        };

        $scope.undoLastLeg = function () {
            $scope.misc.distance = route.popLeg();
        };

    }
]);