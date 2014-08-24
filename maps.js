'use strict';
/**
* Created by mdeluco on 2014-08-09.
*/


function MapRoute (startPos, map, directions, styleOptions) {
    this.map = map;
    this.directions = directions;
    this.distance = 0;

    this.name = '';
    this.visible = true;

    styleOptions = styleOptions || {};
    this.polylineOptions = styleOptions.polylineOptions || {};
    this.markerOptions = styleOptions.markerOptions || {
        map: this.map,
        draggable: true,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 5,
            strokeWeight: 2,
            fillColor: 'white',
            fillOpacity: 1
        }
    };
    this.startMarkerOptions = styleOptions.startMarkerOptions || {
        map: this.map,
        draggable: true,
        icon: 'icons/green.png'
    };
    this.finishMarkerOptions = styleOptions.finishMarkerOptions || {
        map: this.map,
        draggable: true,
        icon: 'icons/red.png'
    };

    var startVertex = {distance: 0};
    this.legs = [startVertex];
    var route = this;
    this.getDirections(startPos, startPos).then(
        function (result) {
            startVertex.marker = new google.maps.Marker(_.extend(route.startMarkerOptions, {
                position: result.routes[0].legs[0].end_location
            }));
        },
        function (status) {
            return status;
        }
    );

}

MapRoute.prototype.append = function (latLng) {

    var route = this,
        prev = this.legs[this.legs.length - 1],
        origin = prev.marker.getPosition(),
        isStartPosition = latLng.equals(this.legs[0].marker.getPosition()),
        vertex = isStartPosition ? this.legs[0] : {};

    var promise = this.getDirections(origin, latLng).then(
        function (result) {

            if (!vertex.marker) {
                vertex.marker = new google.maps.Marker(_.extend(route.finishMarkerOptions, {
                    position: result.routes[0].legs[0].end_location
                }));
            }

            if (route.legs.length > 2) prev.marker.setOptions(route.markerOptions);

            vertex.line_in = new google.maps.Polyline(_.extend(route.polylineOptions, {
                map: route.map,
                path: result.routes[0].overview_path
            }));

            vertex.prev = prev;
            vertex.prev.next = vertex;

            vertex.length = result.routes[0].legs[0].distance.value;
            route.distance += vertex.distance;

            google.maps.addListener(vertex.marker, 'dragend', function () {
                route.getDirections(prev.marker.getPosition(), vertex.marker.getPosition()).then(
                    function (result) {
                        vertex.line_in.setOptions({path: result.routes[0].overview_path});
                    }
                );

                if (vertex.next) {
                    route.getDirections(vertex.marker.getPosition(), vertex.next.marker.getPosition()).then(
                        function (result) {
                            vertex.next.line_in.setOptions({path: result.routes[0].overview_path});
                        }
                    );
                }
            });

            return vertex;

        },
        function (status) {
            return status;
        }
    );

    route.legs.push(vertex);

    return promise;

};

MapRoute.prototype.getDirections = function (origin, destination) {
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

/*
MapRoute.prototype.addLeg = function (latLng) {

    var route = this,
        origin = route.legs.length ? route.legs[route.legs.length - 1].marker.getPosition() : latLng;

    return this.getDirections(origin, latLng).then(
        function (result) {
            var leg = {},
                markerOptions = {};

            if (route.legs.length) {
                leg.polyline = new google.maps.Polyline(_.extend(route.polylineOptions, {
                    map: route.map,
                    path: result.routes[0].overview_path,
                    editable: true
                }));

                leg.prev_leg = route.legs[route.legs.length - 1];
                leg.prev_leg.next_leg = leg;

                leg.distance = result.routes[0].legs[0].distance.value;
                route.distance += leg.distance;
            }

            if (!route.legs.length) {
                markerOptions.icon = 'icons/green.png';
            } else if (latLng.equals(route.legs[0].marker.getPosition())) {
                markerOptions.map = null;
                route.legs[0].polyline = leg.polyline;
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
                position: result.routes[0].legs[0].end_location,
                draggable: true
            }, markerOptions));

            google.maps.event.addListener(leg.marker, 'dragend', function () {
                var origin = leg.polyline ? leg.prev_leg.marker.getPosition() : leg.marker.getPosition();
                var promise = route.getDirections(origin, leg.marker.getPosition()).then(
                    function (result) {
                        leg.marker.setPosition(result.routes[0].legs[0].end_location);
                        if (leg.polyline) leg.polyline.setOptions({path: result.routes[0].overview_path});
                        return leg;
                    },
                    function (status) {
                        // TODO ???
                    }
                );

                if (leg.next_leg) {
                    promise.then(function (leg) {
                        route.getDirections(leg.marker.getPosition(), leg.next_leg.marker.getPosition()).then(
                            function (result) {
                                leg.next_leg.polyline.setOptions({path: result.routes[0].overview_path});
                            }
                        );
                    });
                }

                promise.done();
            });

            route.legs.push(leg);

            return leg;
        },
        function (status) {
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
*/