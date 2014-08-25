'use strict';
/**
* Created by mdeluco on 2014-08-09.
*/


function MapRoute (map, directions, styleOptions) {
    this.map = map;
    this.directions = directions;
    this.distance = 0;

    this.head = this.tail = null;
    this.legs = 0;

    this.name = '';
    this.visible = true;

    styleOptions = styleOptions || {};
    this.polylineOptions = styleOptions.polylineOptions || {
        map: this.map
    };
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

}


MapRoute.prototype.append = function (latLng) {

    var route = this,
        origin = latLng,
        vertex = {
            marker: new google.maps.Marker(this.finishMarkerOptions),
            line_in: new google.maps.Polyline(this.polylineOptions),
            length: 0
        };

    if (this.legs > 0) {
        origin = this.tail.marker.getPosition();
        if (latLng.equals(this.head.marker.getPosition())) {
            vertex = this.head;
        }
        this.tail.next = vertex;
        vertex.prev = this.tail;
        this.tail = vertex;
    } else {
        this.head = vertex;
        this.tail = vertex;
    }

    this.legs++;

    if (vertex === route.head) {
        vertex.marker.setOptions(route.startMarkerOptions);
    }
    if (vertex.prev && vertex.prev !== route.head) {
        vertex.prev.marker.setOptions(route.markerOptions);
    }

    function updateVertex(vertex, origin, destination) {
        return route.getDirections(origin, destination).then(
            function (directions) {
                vertex.marker.setPosition(directions.routes[0].legs[0].end_location);
                vertex.line_in.setOptions({path: directions.routes[0].overview_path});

                route.distance -= vertex.length;
                vertex.length = directions.routes[0].legs[0].distance.value;
                route.distance += vertex.length;

                return directions.routes[0].legs[0].end_location;
            }
        );
    }

    google.maps.event.addListener(vertex.marker, 'dragend', function () {
        var latLng = vertex.marker.getPosition();
        var origin = vertex.prev ? vertex.prev.marker.getPosition() : latLng;
        updateVertex(vertex, origin, latLng).then(
            function (origin) {
                if (!vertex.next) return;
                return updateVertex(vertex.next, origin, vertex.next.marker.getPosition());
            }
        );
    });

    return updateVertex(vertex, origin, latLng);

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


MapRoute.prototype.pop = function () {
    if (this.legs === 0) return;

    var vertex = this.tail;
    vertex.marker.setMap(null);

    if (this.legs === 1) {
        this.head = this.tail = null;
    } else {
        vertex.line_in.setMap(null);
        this.tail = vertex.prev;
        this.tail.next = null;
    }

    this.distance -= vertex.length;
    this.legs--;

    return vertex;
};

/*
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