/**
 * Created by mdeluco on 2014-08-02.
 */
'use strict';

angular.module('maps', [])

.controller('MapsCtrl', [
    '$scope',
    '$timeout',
    function ($scope, $timeout) {

        $scope.misc = {
            title: "Maps"
        };

        var mapOptions = {
            center: new google.maps.LatLng(46.5220, -84.3451),
            zoom: 15,
            disableDoubleClickZoom: true
        };

        var map = new google.maps.Map($('#map-canvas')[0], mapOptions),
            directions = new google.maps.DirectionsService(),
            markers = [],
            polylines = [],
            clickTimeout,
            routingListenerId;

        $scope.misc.latlng = {
            lat: map.getCenter().lat(),
            lng: map.getCenter().lng()
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

        var getDirections = function (origin, destination) {
            directions.route({
                origin: origin,
                destination: destination,
                travelMode: google.maps.TravelMode.DRIVING
            }, function (result, status) {

                var pos = destination;
                if (status == google.maps.DirectionsStatus.OK) {
                    pos = result.routes[0].legs[0].end_location;
                }

                // TODO error rather than pushing marker for e
                markers.push(new google.maps.Marker({
                    map: map,
                    position: pos
                }));

                if (markers.length) {
                    polylines.push(new google.maps.Polyline({
                        map: map,
                        path: result.routes[0].overview_path
                    }));
                }

            });
        };

        var routingListener = function (e) {
            $timeout.cancel(clickTimeout);

            var origin = e.latLng;
            if (markers.length) {
                origin = markers[markers.length - 1].getPosition();
            }

            getDirections(origin, e.latLng);
        };

        $scope.startRouting = function () {
            map.setOptions({draggableCursor: 'crosshair'});
            routingListenerId = google.maps.event.addListener(map, 'dblclick', routingListener);
        };

        $scope.finishRouting = function () {
            map.setOptions({draggableCursor: 'auto'});
            google.maps.event.removeListener(routingListenerId);
            getDirections(markers[markers.length - 1].getPosition(), markers[0].getPosition());
        };

    }
]);