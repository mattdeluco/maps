/**
 * Created by mdeluco on 2014-08-02.
 */
'use strict';

angular.module('maps', [])

.controller('MapsCtrl', [
    '$scope',
    '$timeout',
    '$q',
    function ($scope, $timeout, $q) {

        var directions = new google.maps.DirectionsService(),
            route,
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

        function Route (map, directions) {
            this.map = map;
            this.directions = directions;
            this.legs = [];
            this.distance = 0;
        }

        Route.prototype.getDirections = function (origin, destination) {
            var deferred = $q.defer();

            this.directions.route({
                origin: origin,
                destination: destination,
                travelMode: google.maps.TravelMode.DRIVING
            }, function (result, status) {
                if (status != google.maps.DirectionsStatus.OK) {
                    deferred.reject(status);
                } else {
                    deferred.resolve(result);
                }
            });

            return deferred.promise;
        };

        Route.prototype.addLeg = function (latLng, lastLeg) {

            lastLeg = lastLeg || false;

            var route = this,
                origin = route.legs.length ? route.legs[route.legs.length - 1].marker.getPosition() : latLng,
                destination = lastLeg ? route.legs[0].marker.getPosition() : latLng;

            return this.getDirections(origin, destination).then(
                function (result) {
                    var leg = {};

                    if (lastLeg) {
                        leg.marker = route.legs[0].marker;
                    } else {
                        leg.marker = new google.maps.Marker({
                            map: route.map,
                            position: result.routes[0].legs[0].end_location
                        });
                    }

                    leg.polyline = new google.maps.Polyline({
                        map: route.map,
                        path: result.routes[0].overview_path
                    });

                    leg.distance = result.routes[0].legs[0].distance.value;

                    route.distance += leg.distance;
                    route.legs.push(leg);

                    return route.distance;
                },
                function (status) {
                    // TODO handle error
                });
        };

        Route.prototype.endRoute = function () {
            return this.addLeg(null, true);
        };

        Route.prototype.popLeg = function () {
            var leg = this.legs.pop();
            if (!leg) return;

            leg.marker.setMap(null);
            leg.polyline.setMap(null);
            route.distance -= leg.distance;

            return route.distance;
        };


        var distanceHandler = function (distance) {
            // TODO Figure out why this works without $scope.$apply()
            $scope.misc.distance = distance;
        };

        var routingListener = function (e) {
            $timeout.cancel(clickTimeout);
            route.addLeg(e.latLng).then(distanceHandler);
        };

        $scope.startRouting = function () {
            route = new Route(map, directions);
            map.setOptions({draggableCursor: 'crosshair'});
            routingListenerId = google.maps.event.addListener(map, 'dblclick', routingListener);
        };

        $scope.finishRouting = function () {
            map.setOptions({draggableCursor: 'auto'});
            google.maps.event.removeListener(routingListenerId);
            route.endRoute().then(distanceHandler);
        };

        $scope.undoLastLeg = function () {
            distanceHandler(route.popLeg());
        };

    }
]);