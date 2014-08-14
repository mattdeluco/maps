'use strict';
/**
* Created by mdeluco on 2014-08-09.
*/

function MapRoute (map, directions, polylineOptions) {
    this.map = map;
    this.directions = directions;
    this.legs = [];
    this.distance = 0;
    this.polylineOptions = polylineOptions || {};
}

MapRoute.prototype.getDirections = function (origin, destination) {
    // TODO Should this be injected?
    var deferred = Q.defer();

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

MapRoute.prototype.addLeg = function (latLng) {

    var route = this,
        origin = route.legs.length ? route.legs[route.legs.length - 1].marker.getPosition() : latLng;

    return this.getDirections(origin, latLng).then(
        function (result) {
            var leg = {},
                markerOptions = {};

            if (!route.legs.length) {
                markerOptions.icon = 'icons/green.png';
            } else if (latLng.equals(route.legs[0].marker.getPosition())) {
                markerOptions.map = null;
            } else {
                markerOptions.icon = 'icons/red.png';
            }

            if (route.legs.length > 1) {
                route.legs[route.legs.length - 1].marker.setOptions({
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 5,
                        strokeWeight: 2,
                        fillColor: 'white',
                        fillOpacity: 1
                    }
                });
            }

            leg.marker = new google.maps.Marker(_.extend({
                map: route.map,
                position: result.routes[0].legs[0].end_location
            }, markerOptions));

            if (route.legs.length > 0) {
                leg.polyline = new google.maps.Polyline(_.extend(route.polylineOptions, {
                    map: route.map,
                    path: result.routes[0].overview_path
                }));

                leg.distance = result.routes[0].legs[0].distance.value;
                route.distance += leg.distance;
            }

            route.legs.push(leg);

            return leg;
        },
        function (status) {
            // TODO handle error
            return status;
        });
};

MapRoute.prototype.popLeg = function () {
    var leg = this.legs.pop();
    if (!leg) return;

    // Don't remove the marker on a finished route, where start marker == finish marker.
    if (!this.legs.length || leg.marker != this.legs[0].marker) {
        leg.marker.setMap(null);
    }
    if (leg.polyline) leg.polyline.setMap(null);

    return this.distance -= leg.distance;
};

MapRoute.prototype.setAllMap = function (map) {
    var leg;
    for (var i = 0; i < this.legs.length; i++) {
        leg = this.legs[i];
        leg.marker.setMap(map);
        if (leg.polyline) leg.polyline.setMap(map);
    }
};

MapRoute.prototype.hide = function () {
    this.setAllMap(null);
};

MapRoute.prototype.show = function () {
    this.setAllMap(this.map);
};

MapRoute.prototype.clear = function () {
    this.hide();
    this.legs = [];
    this.distance = 0;
};