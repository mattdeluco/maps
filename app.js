/**
 * Created by mdeluco on 2014-08-02.
 */
'use strict';

angular.module('maps', [])

.controller('MapsCtrl', [
    '$scope',
    '$timeout',
    function ($scope, $timeout) {

        var directions = new google.maps.DirectionsService(),
            markers = [],
            polylines = [],
            clickTimeout,
            routingListenerId;

        var mapOptions = {
            center: new google.maps.LatLng(46.5220, -84.3451),
            zoom: 15,
            disableDoubleClickZoom: true
        };

        var map = new google.maps.Map($('#map-canvas')[0], mapOptions);

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

        var getDirections = function (origin, destination) {
            directions.route({
                origin: origin,
                destination: destination,
                travelMode: google.maps.TravelMode.DRIVING
            }, function (result, status) {

                if (status != google.maps.DirectionsStatus.OK) {
                    // TODO error?
                    return;
                }

                var pos = result.routes[0].legs[0].end_location;

                markers.push(new google.maps.Marker({
                    map: map,
                    position: pos
                }));

                if (markers.length > 1) {
                    polylines.push(new google.maps.Polyline({
                        map: map,
                        path: result.routes[0].overview_path
                    }));
                }

                $scope.$apply(function () {
                    $scope.misc.distance += result.routes[0].legs[0].distance.value;
                });
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