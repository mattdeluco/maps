/**
 * Created by mdeluco on 2014-08-02.
 */
'use strict';

angular.module('maps', [])

.controller('MapsCtrl', [
    '$scope',
    function ($scope) {

        $scope.misc = {
            title: "Maps"
        };

        var mapOptions = {
            center: new google.maps.LatLng(46.50152360421799, -84.28084373474121),
            zoom: 15,
            draggable: false,
            draggableCursor: "crosshair",
            scrollwheel: false,
            disableDoubleClickZoom: true,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            mapTypeControlOptions: {
                mapTypeIds: [google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.HYBRID,
                    google.maps.MapTypeId.SATELLITE]
            }
        };

        var map = new google.maps.Map(document.getElementById('map-canvas'),
            mapOptions);

        $scope.misc.latlng = {
            lat: map.getCenter().lat(),
            lng: map.getCenter().lng()
        };

        google.maps.event.addListener(map, 'click', function (e) {
            $scope.$apply(function () {
                $scope.misc.latlng = {
                    lat: e.latLng.lat(),
                    lng: e.latLng.lng()
                };
            });
        });

        $scope.map = map;
    }
]);