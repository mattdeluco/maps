'use strict';
/**
* Created by mdeluco on 2014-08-09.
*/

function MapRoute (map, directions) {
    this.map = map;
    this.directions = directions;
    this.legs = [];
    this.distance = 0;
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
            var leg = {};

            // Start
            if (!route.legs.length) {
                leg.marker = new google.maps.Marker({
                    map: route.map,
                    position: result.routes[0].legs[0].end_location,
                    icon: 'icons/green.png'
                });
            // Finish
            } else if (route.legs.length && latLng === route.legs[0].marker.getPosition()) {
                leg.marker = route.legs[0].marker;
            // Intermediate
            } else {
                leg.marker = new google.maps.Marker({
                    map: route.map,
                    draggable: true,
                    position: result.routes[0].legs[0].end_location,
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 5,
                        strokeWeight: 2,
                        fillColor: 'white',
                        fillOpacity: 1
                    }
                });
            }

            leg.polyline = new google.maps.Polyline({
                map: route.map,
                path: result.routes[0].overview_path,
                strokeColor: '#009900',
                strokeOpacity: 0.4,
                strokeWeight: 5
            });

            leg.distance = result.routes[0].legs[0].distance.value;

            route.distance += leg.distance;
            route.legs.push(leg);

            return route.distance;
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
    leg.polyline.setMap(null);

    return this.distance -= leg.distance;
};

MapRoute.prototype.setAllMap = function (map) {
    for (var i = 0; i < this.legs.length; i++) {
        this.legs[i].marker.setMap(map);
        this.legs[i].polyline.setMap(map);
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