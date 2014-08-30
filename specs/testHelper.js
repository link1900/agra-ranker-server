var testHelper = module.exports = {};
var request = require('supertest');
var siteUrl = process.env.testUrl;
var mongoose = require('mongoose');
var User = mongoose.model('User');
var GroupLevel = mongoose.model('GroupLevel');
var RankingSystem = mongoose.model('RankingSystem');
var Race = mongoose.model('Race');
var Greyhound = mongoose.model('Greyhound');
var Placing = mongoose.model('Placing');
var PointScale = mongoose.model('PointScale');
var PointScaleValue = mongoose.model('PointScaleValue');
var Query = mongoose.model('Query');
var QueryParameter = mongoose.model('QueryParameter');
var AllowedUser = mongoose.model('AllowedUser');
testHelper.publicSession = request.agent(siteUrl);
testHelper.authSession = request.agent(siteUrl);

testHelper.login = function(agent , done){
    var cred = {email: 'link1900@gmail.com', password: 'test'};
    agent
        .post('/login')
        .send(cred)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
};

testHelper.logout = function(agent , done){
    var cred = {email: 'link1900@gmail.com', password: 'test'};
    agent
        .post('/logout')
        .send(cred)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
};

testHelper.setup = function(done){
    testHelper.loadUsers(function(){
        testHelper.login(testHelper.authSession, done);
    });
};

testHelper.tearDown = function(done){
    testHelper.clearUsers(function(){
        testHelper.logout(testHelper.authSession, done);
    });
};

testHelper.letter1000 = "0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789" +
    "0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789" +
    "0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789" +
    "0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789" +
    "0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789" +
    "0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789" +
    "0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789" +
    "0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789" +
    "0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789" +
    "0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789" +
    "0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789";

testHelper.loadUsers = function(done){
    new AllowedUser({"email":"nbrown99@gmail.com"}).save();
    new AllowedUser({"email":"link1900@gmail.com"}).save();
    new User({
        "provider" : "local",
        "email" : "link1900@gmail.com",
        "password" : "test",
        "_id" : "532675365d68bab8234c7e7f"
    }).save(done);
};

testHelper.clearUsers = function(done){
    User.remove({}, done);
};

testHelper.loadGroupLevels = function(done){
    GroupLevel.remove({}, function(){
        new GroupLevel({"_id" : "531d1f72e407586c21476ef7",
            "name" : "Group 1",
            "level":1}).save(function(){
                new GroupLevel({"_id" : "531d1f72e407586c21476f0c",
                    "name" : "Group 2",
                    "level": 2}).save(function(){
                        new GroupLevel({"_id" : "531d1f72e407586c21476f0d",
                            "name" : "Group 3",
                            "level": 2}).save(done);
                    });
            });
    });
};

testHelper.loadRankingSystem = function(done){
    RankingSystem.remove({}, function(){
        new RankingSystem({"_id" : "5340bfc15c4ac1fdcd47816d",
            "name" : "Test Ranking System",
            "description":"test Rankings"}).save(function(){
                new RankingSystem({"_id" : "53411feb5c4ac1fdcd47817d",
                    "name" : "Mega Ranking System",
                    "description":"test rankings"}).save(function(){
                        new RankingSystem(    {
                            "_id" : "53412feb5c4ac1fdcd4781ff",
                            "name": "Agra Rankings",
                            "description": "The main ranking system for agra",
                            "matchingStrategy": "split",
                            "pointDefinitions":[
                                {
                                    filters: [
                                        {field: "placing", "comparator": "=", "value": "1"},
                                        {field: "race.date", "comparator": ">=", "value": "##currentFinancialYear.start"},
                                        {field: "race.date", "comparator": "<=", "value": "##currentFinancialYear.end"},
                                        {field: "race.groupLevel.name", "comparator": "=", "value": "Group 1"},
                                        {field: "distanceMeters", "comparator": "<", "value": "715"},
                                        {field: "disqualified", "comparator": "=", "value": false}
                                    ],
                                    points: 70
                                }
                            ]
                        }).save(done);
                    });
            });
    });



};

testHelper.clearRankingSystems = function(done){
    RankingSystem.remove({}, done);
};

testHelper.loadPointScale = function(done){
    PointScale.remove({}, function(){
        new PointScale({"_id" : "5340caa05c4ac1fdcd478171",
            "name" : "Group 1 Sprint"}).save(function(){
                new PointScale({"_id" : "53411de55c4ac1fdcd47817a",
                    "name" : "Group 2 Sprint"}).save(done);
            });
    });
};

testHelper.clearPointScale = function(done){
    PointScale.remove({}, done);
};

testHelper.loadPointScaleValue = function(done){
    PointScaleValue.remove({}, function(){
        new PointScaleValue({"_id" : "5340cc015c4ac1fdcd478175",
            "pointScaleRef":"5340caa05c4ac1fdcd478171", "placing" : 1,points:70}).save(done);
    });
};

testHelper.clearPointScaleValue = function(done){
    PointScaleValue.remove({}, done);
};

testHelper.loadQuery = function(done){
    Query.remove({}, function(){
        new Query({"_id" : "53411dc15c4ac1fdcd478178",
            "rankingSystemRef" : "5340bfc15c4ac1fdcd47816d",
            "pointScaleRef":"5340caa05c4ac1fdcd478171"}).save(done);
    });
};

testHelper.clearQuery = function(done){
    Query.remove({}, done);
};

testHelper.loadQueryParameter = function(done){
    QueryParameter.remove({}, function(){
        new QueryParameter({"_id" : "53411e135c4ac1fdcd47817b",
            "queryRef" : "53411dc15c4ac1fdcd478178",
            "field":"groupLevel.level",
            "comparator":"=",
            "value":"1"}).save(done);
    });
};

testHelper.clearQueryParameter = function(done){
    QueryParameter.remove({}, done);
};

testHelper.clearGroupLevels = function(done){
    GroupLevel.remove({}, done);
};

testHelper.loadRaces = function(done){
    testHelper.loadGroupLevels(function(){
        Race.remove({}, function(){
            new Race({"_id" : "531d1f72e407586c21476ea8",
                "name" : "race1",
                "date": new Date(5,5,2014),
                "groupLevelRef":"531d1f72e407586c21476ef7",
                "distanceMeters": 515,
                "disqualified":false}).save(function(){
                    new Race({"_id" : "531d1f72e407586c21476ec4",
                        "name" : "Race2",
                        "date": new Date(),
                        "groupLevelRef":"531d1f72e407586c21476f0c",
                        "distanceMeters": 715,
                        "disqualified":false}).save(done);
                });
        });
    });
};

testHelper.clearRaces = function(done){
    testHelper.clearGroupLevels(function(){
        Race.remove({}, done);
    });
};

testHelper.loadGreyhounds = function(done){
    Greyhound.remove({}, function(){
        new Greyhound({"_id" : "53340c2d8e791cd5d7c731d7", "name" : "grey1"}).save();
        new Greyhound({"_id":'531d1f74e407586c2147737b', name:"grey2"}).save();
        new Greyhound({"_id":'53407b9d5c4ac1fdcd47816a', name:"grey5"}).save();
        new Greyhound({"_id":'531d1f72e407586c21476e49', name:"grey4", sireRef:"53340c2d8e791cd5d7c731d7", damRef:"531d1f74e407586c2147737b"}).save();
        new Greyhound({"_id":'531d1f74e407586c214773df', name:"grey3"}).save(done);
    });
};

testHelper.clearGreyhounds = function(done){
    Greyhound.remove({}, done);
};

testHelper.loadPlacings = function(done){
    testHelper.loadRaces(function(){
        testHelper.loadGreyhounds(function(){
            Placing.remove({}, function(){
                new Placing({"_id" : "531d1f82e407586c21476eb9",
                    "placing" : "2",
                    "raceRef": "531d1f72e407586c21476ea8",
                    "greyhoundRef":"531d1f74e407586c2147737b"}).save();
                new Placing({"_id" : "531d1f82e407586c21476dc9",
                    "placing" : "3",
                    "raceRef": "531d1f72e407586c21476ea8",
                    "greyhoundRef":"53407b9d5c4ac1fdcd47816a"}).save();
                new Placing({"_id" : "531d1f82e407586c21476ea9",
                    "placing" : "1",
                    "raceRef": "531d1f72e407586c21476ea8",
                    "greyhoundRef":"53340c2d8e791cd5d7c731d7"}).save(done);
            });
        });
    });
};

testHelper.clearPlacings = function(done){
    Placing.remove({}, function(){
        testHelper.clearRaces(function(){
            testHelper.clearGreyhounds(done);
        });
    });
};