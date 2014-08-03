/**
 * Created by mdeluco on 2014-08-02.
 */
'use strict';

angular.module('maps', ['google-maps']);

angular.module('maps').controller('MapsCtrl', [
    '$scope',
    function ($scope) {
        $scope.map = {
            center: {
                latitude: 45,
                longitude: -73
            },
            zoom: 8,
            draggable: 'true'
        };

        $scope.misc = {
            title: "maps"
        };
    }
]);