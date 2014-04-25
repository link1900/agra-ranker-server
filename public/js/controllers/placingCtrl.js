angular.module('controllers').controller('PlacingCtrl', ['$scope', '$routeParams', 'headerHelperService', '$location', 'placingService',
    function($scope, $routeParams, headerHelperService, $location, placingService) {

        $scope.findOne = function() {
            placingService.get({
                placingId: $routeParams.id
            }, function(model) {
                $scope.load(model);
            }, function(){
                $scope.alerts = [
                    { type: 'danger', msg: "Failed load using the id " + $routeParams.id }
                ];
            });
        };

        $scope.load = function(model){
            $scope.placing = model;
        };

        $scope.placingService = placingService;

        $scope.placings = [
           [{"name":"ABSOLUTE CHAOS"}, {"name":"ABSOLUTE STYLE"}],
           [{"name":"BOMBASTIC SHIRAZ"}],
           [{"name":"ABBY SHIRAZ"}],
           [{"name":"MAGNAMIZE"}],
           [{"name":"ZULU SONJA"}],
           [{"name":"DYNA BEAUTY"}],
           [{"name":"ABOVE THE SKY"}],
           []
        ];

        $scope.greyhoundField = "";

        $scope.sortableOptions = {
            placeholder: "placing-greyhound-placeholder",
            connectWith: ".placing-container"
        };

        $scope.removePlacing = function(placingIndex, greyhoundIndex){
            $scope.placings[placingIndex].splice(greyhoundIndex, 1);
        };

        $scope.savePlacings = function(){
            //get the race id
            var raceId = $routeParams.id;

            //now construct...why contract?
        };

        $scope.convertToDisplayArrays = function(placings){

        };

        $scope.showAdd = function(){
            $scope.formMode = 'add';
        };

        $scope.showView = function(){
            $scope.formMode = 'view';
        };

        $scope.showEdit = function(){
            $scope.formMode = 'edit';
        };

        $scope.formMode = 'view';

        $scope.addGreyhound = function(){
            var greyhoundName = $scope.greyhoundField;
            $scope.alerts = [];
            var done = false;
            if (greyhoundName == null || greyhoundName == undefined || greyhoundName.length == 0){
                $scope.alerts = [
                    { type: 'danger', msg: "Cannot add empty greyhound" }
                ];
                return false;
            }
            greyhoundName = greyhoundName.toUpperCase();
            if($scope.inPlacings(greyhoundName)){
                $scope.alerts = [
                    { type: 'danger', msg: "Cannot add the same greyhound" }
                ];
                return false;
            }

            for(var i = 0; i < $scope.placings.length; i++){
                if ($scope.placings[i].length == 0 && done == false){
                    $scope.placings[i].push({"name":greyhoundName});
                    done = true;
                }
            }

            if (done == false){
                $scope.placings[0].push({"name":greyhoundName});
            }

            $scope.greyhoundField = "";
            $scope.showView();
            return true;
        };

        $scope.inPlacings = function(greyhoundName){
            var result = _.find($scope.placings, function(placingSet){
                return _.find(placingSet, function(greyhound){
                    return _.isEqual(greyhoundName, greyhound.name);
                });
            });
            return result != null;
        };

        $scope.loadPlacingsFromRace = function(raceId){
            placingService.query({raceId: raceId}, function(resultModels) {
                $scope.placings = resultModels;
            });
        };

        $scope.create = function(){
            placingService.save({}, $scope.placing, function(response){
                    $location.path('placing/view/'+ response._id);
                },
                function(error){
                    $scope.alerts = [
                        { type: 'danger', msg: "create " + error.data.error }
                    ];
                });
        };

        $scope.isInvalid = function(formField){
            return formField.$dirty && formField.$invalid;
        };

        $scope.isValid =  function(formField){
            return formField.$dirty && !formField.$invalid && !$scope.hasServerErrors();
        };

        $scope.hasServerErrors = function(){
            return _.where($scope.alerts, { 'type': 'danger' }).length > 0;
        };

        $scope.save = function(){
            $scope.placing.$update(function(data){
                    $scope.alerts = [
                        { type: 'success', msg: "Updated " + data.name }
                    ];
                    $scope.load(data);
                },
                function(error){
                    $scope.alerts = [
                        { type: 'danger', msg: "update " + error.data.error }
                    ];
                });
        };

        $scope.deleteEntity = function(){
            $scope.placing.$delete(function(data){
                    delete $scope.batch;
                    $scope.alerts = [
                        { type: 'success', msg: "Deleted " + data.name.toUpperCase() }
                    ];
                    $location.path('/placing');
                },
                function(error){
                    $scope.alerts = [
                        { type: 'danger', msg: "delete " + error.data }
                    ];
                }
            );
        };
    }
]);