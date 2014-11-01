angular.module('controllers').controller('BatchCtrl', ['$scope', '$routeParams', 'headerHelperService', 'batchService', 'rankerEventBus',
    function($scope, $routeParams, headerHelperService, batchService, rankerEventBus) {

        $scope.findOne = function() {
            batchService.get({
                batchId: $routeParams.id
            }, function(batch) {
                $scope.loadBatch(batch);
            }, function(){
                $scope.alerts = [
                    { type: 'danger', msg: "Failed load using the id " + $routeParams.id }
                ];
            });
        };

        $scope.cancelBatch = function(){
            $scope.batch.status = 'Cancelled';
            $scope.batch.$update(function(data){
                    $scope.alerts = [
                        { type: 'success', msg: "Canceled batch" }
                    ];
                    $scope.loadBatch(data);
                    rankerEventBus.broadcastEvent(rankerEventBus.EVENTS.ENTITY_BATCH_UPDATED, data);
                },
                function(error){
                    $scope.alerts = [
                        { type: 'danger', msg: "Failed to update: " + error.data }
                    ];
                }
            );
        };

        $scope.loadBatch = function(batch){
            $scope.batch = batch;
        };

        $scope.batchService = batchService;

        $scope.columnInfo = [
            {title: "Status", field:"status", baseLink:"#/batch/view/", linkField: "_id", link:true},
            {title: "File Name", field:"name"},
            {title: "Batch Type", field:"type"},
            {title: "Created Date", field:"createdAt", filter: "date", filterFormat: 'medium'}
        ];

        $scope.deleteBatch = function(){
            $scope.batch.$delete(function(data){
                    delete $scope.batch;
                    $scope.alerts = [
                        { type: 'success', msg: "Deleted " + data.name.toUpperCase() }
                    ];
                },
                function(error){
                    $scope.alerts = [
                        { type: 'danger', msg: "Failed to delete: " + error.data }
                    ];
                }
            );
        };
    }
]);