const rankingSystemService = module.exports = {};

const _ = require('lodash');
const q = require('q');
const moment = require('moment-timezone');

const mongoService = require('../mongoService');
const RankingSystem = require('./rankingSystem').model;
const baseService = require('../baseService');

baseService.addStandardServiceMethods(rankingSystemService, RankingSystem);

rankingSystemService.preProcessRaw = function (entityRequest) {
    const model = entityRequest.rawEntity;

    if (!model) {
        return q.reject('must have a body');
    }

    entityRequest.newEntity = model;
    return q(entityRequest);
};

rankingSystemService.validateAllotment = function (allotment) {
    if (allotment.points == null) {
        return q.reject('a point allotment must have points');
    }

    if (!_.isNumber(allotment.points)) {
        return q.reject('point allotment points must be a number');
    }
    if (allotment.criteria.length > 0) {
        const validations = _.map(allotment.criteria, (criteria) => {
            return rankingSystemService.validateAllotmentCriteria(criteria);
        });
        return q.all(validations);
    } else {
        return q(allotment);
    }
};

rankingSystemService.validateAllotmentCriteria = function (criteria) {
    if (criteria.field == null || criteria.field.length < 1 || !_.isString(criteria.field)) {
        return q.reject('criteria must have a valid field');
    }

    if (criteria.comparator == null) {
        return q.reject('criteria must have a comparator');
    }

    if (criteria.comparator != null) {
        const validSet = ['=', '>', '<', '>=', '<='];
        if (!_.includes(validSet, criteria.comparator)) {
            return q.reject(`comparator must be one of the following: ${validSet.join(',')}`);
        }
    }

    if (criteria.value == null || criteria.value.length < 1) {
        return q.reject('criteria must have a valid value');
    }

    if (criteria.type == null) {
        return q.reject('criteria must have a type');
    }

    if (criteria.type != null) {
        const validTypeSet = ['Text', 'Number', 'Date', 'Boolean', 'Preset'];
        if (!_.includes(validTypeSet, criteria.type)) {
            return q.reject(`criteria type must be one of the following: ${validTypeSet.join(',')}`);
        }

        if (criteria.type === 'Text') {
            if (!_.isString(criteria.value)) {
                return q.reject('if criteria type is text the value must be a text');
            }
        }

        if (criteria.type === 'Number') {
            if (!_.isNumber(criteria.value)) {
                return q.reject('if criteria type is number the value must be a number');
            }
        }

        if (criteria.type === 'Date') {
            if (!_.isDate(criteria.value)) {
                return q.reject('if criteria type is date the value must be a date');
            }
        }

        if (criteria.type === 'Boolean') {
            if (!_.isBoolean(criteria.value)) {
                return q.reject('if criteria type is boolean the value must be a boolean');
            }
        }
    }

    return q(true);
};

rankingSystemService.checkAllotmentIsValid = function (model) {
    if (model.pointAllotments != null) {
        if (!_.isArray(model.pointAllotments)) {
            return q.reject('pointAllotments must be an array');
        } else if (model.pointAllotments.length > 0) {
            const validations = _.map(model.pointAllotments, (allotment) => {
                return rankingSystemService.validateAllotment(allotment);
            });
            return q.all(validations);
        } else {
            return q(model);
        }
    } else {
        return q(model);
    }
};

rankingSystemService.validate = function (entityRequest) {
    const model = entityRequest.newEntity;
    if (!model.name) {
        return q.reject('name field is required');
    }

    if (model.name.length === 0) {
        return q.reject('name cannot be blank');
    }

    if (model.description != null && model.description.length > 1000) {
        return q.reject('description field is too long');
    }

    if (model.equalPositionResolution != null) {
        const validResolutions = ['splitPoints', 'samePoints'];
        if (!_.includes(validResolutions, model.equalPositionResolution)) {
            return q.reject(`equalPositionResolution must be one of the following: ${validResolutions.join(',')}`);
        }
    }

    return rankingSystemService.checkAllotmentIsValid(model).then(() => {
        return rankingSystemService.checkNameDoesNotExist(model).then(() => {
            return q(entityRequest);
        });
    });
};

rankingSystemService.checkNameDoesNotExist = function (model) {
    return mongoService.find(RankingSystem, { name: model.name }).then((results) => {
        if (results.length === 0) {
            return q(true);
        } else if (results.length === 1 && _.isEqual(results[0]._id, model._id)) {
            return q(true);
        } else {
            return q.reject('cannot have the same name as an existing ranking system');
        }
    });
};

rankingSystemService.getQueryForPointAllotment = function (pointAllotment) {
    const query = {};
    pointAllotment.criteria.forEach((criteria) => {
        // replace placeholders
        if (criteria.value != null && _.isString(criteria.value) && criteria.value.indexOf('##') === 0) {
            criteria.value = rankingSystemService.convertPlaceHolder(criteria.value);
        }
    });

    pointAllotment.criteria.forEach((criteria) => {
        switch (criteria.comparator) {
            case '=':
                query[criteria.field] = criteria.value;
                break;
            case '>':
                rankingSystemService.addField(query, criteria.field, { $gt: criteria.value });
                break;
            case '<':
                rankingSystemService.addField(query, criteria.field, { $lt: criteria.value });
                break;
            case '>=':
                rankingSystemService.addField(query, criteria.field, { $gte: criteria.value });
                break;
            case '<=':
                rankingSystemService.addField(query, criteria.field, { $lte: criteria.value });
                break;
            case '!=':
                rankingSystemService.addField(query, criteria.field, { $ne: criteria.value });
                break;
            case 'exists' :
                rankingSystemService.addField(query, criteria.field, { $exists: criteria.value });
                break;
            default:
                query[criteria.field] = criteria.value;
                break;
        }
    });
    return query;
};

rankingSystemService.addField = function (query, field, statement) {
    if (query[field]) {
        query[field] = _.extend(query[field], statement);
    } else {
        query[field] = statement;
    }
};

rankingSystemService.convertPlaceHolder = function (placeholder) {
    if (_.includes(_.keys(rankingSystemService.presetCriteriaFields), placeholder)) {
        return rankingSystemService.presetCriteriaFields[placeholder].value;
    } else {
        return placeholder;
    }
};

rankingSystemService.getFinancialYearForDate = function (now) {
    const midYear = moment(now).set('month', 'July').set('date', 1).startOf('day');
    if (midYear.isAfter(now)) {
        const start = midYear.clone().subtract(12, 'months').toDate();
        const end = midYear.subtract(1, 'days')
            .endOf('day')
            .toDate();
        return { start, end };
    } else {
        const start = midYear.toDate();
        const end = midYear.clone()
            .add(12, 'months')
            .subtract(1, 'days')
            .endOf('day')
            .toDate();
        return { start, end };
    }
};

rankingSystemService.getYearForDate = function (now) {
    const startYear = moment(now)
        .set('month', 'Jan')
        .set('date', 1)
        .startOf('day')
        .toDate();
    const endYear = moment(now)
        .set('month', 'Dec')
        .set('date', 31)
        .endOf('day')
        .toDate();
    return { start: startYear, end: endYear };
};

rankingSystemService.presetCriteriaFields = {
    currentFinancialYearStart: {
        label: 'Current Financial Year Start',
        value: rankingSystemService.getFinancialYearForDate(new Date()).start
    },
    currentFinancialYearEnd: {
        label: 'Current Financial Year End',
        value: rankingSystemService.getFinancialYearForDate(new Date()).end
    },
    currentCalendarYearStart: {
        label: 'Current Calendar Year Start',
        value: rankingSystemService.getYearForDate(new Date()).start
    },
    currentCalendarYearEnd: {
        label: 'Current Calendar Year End',
        value: rankingSystemService.getYearForDate(new Date()).end
    }
};

rankingSystemService.getScoresForPlacing = async (placing) => {
    const rankingSystems = await rankingSystemService.find({});
    return Promise.all(rankingSystems.map(rankingSystem => rankingSystemService.getScoreForPlacing(placing, rankingSystem)));
};

rankingSystemService.getScoreForPlacing = async (placing, rankingSystem) => {
    const applyingAllotments = _.filter(rankingSystem.pointAllotments, allotment => rankingSystemService.doesAllotmentApply(placing, allotment));
    const allotmentPoints = applyingAllotments.map(allotment => allotment.points);
    return { type: rankingSystem.name, value: _.sum(allotmentPoints) };
};

rankingSystemService.doesAllotmentApply = (placing, pointAllotment) => {
    return _.every(pointAllotment.criteria, criteria => rankingSystemService.doesCriteriaApply(placing, criteria));
};

rankingSystemService.doesCriteriaApply = (placing, criteria) => {
    const field = _.get(placing, criteria.field);
    const value = criteria.value;
    switch (criteria.comparator) {
        case '=':
            return field === value;
        case '>':
            return field > value;
        case '<':
            return field < value;
        case '>=':
            return field >= value;
        case '<=':
            return field <= value;
        case '!=':
            return field !== value;
        case 'exists' :
            return field !== null && field !== undefined;
        default:
            return field === value;
    }
};

rankingSystemService.getRankingSystem = async function (rankingSystemName) {
    const rankingSystems = await rankingSystemService.find({ name: rankingSystemName });
    if (!rankingSystems || rankingSystems.length !== 1) {
        return null;
    }
    let rankingSystem = rankingSystems[0];
    rankingSystem = rankingSystem.toObject();
    rankingSystem = rankingSystemService.insertCommonCriteria(rankingSystem);
    return rankingSystem;
};

rankingSystemService.insertCommonCriteria = function (rankingSystem) {
    rankingSystem.pointAllotments.forEach((pointAllotment) => {
        if (rankingSystem.commonCriteria && rankingSystem.commonCriteria.length > 0) {
            pointAllotment.criteria = pointAllotment.criteria.concat(rankingSystem.commonCriteria);
        }
    });
    return rankingSystem;
};

rankingSystemService.generateGreyhoundRankingSystem = () => {
    const mainRanker = {
        name: 'Greyhounds',
        description: 'The main ranking system',
        equalPositionResolution: 'splitPoints',
        groupBy: {
            label: 'greyhound.name',
            field: 'greyhoundRef'
        },
        pointAllotments: [],
        commonCriteria: [
            { field: 'race.disqualified', comparator: '=', value: false, type: 'Boolean' }
        ]
    };

    // sprint group
    const baseSprint = [{ field: 'race.distanceMeters', comparator: '<', value: 595, type: 'Number' }];
    const group1Sprint = [{ field: 'race.groupLevelName', comparator: '=', value: 'Group 1', type: 'Text' }].concat(baseSprint);
    const group2Sprint = [{ field: 'race.groupLevelName', comparator: '=', value: 'Group 2', type: 'Text' }].concat(baseSprint);
    const group3Sprint = [{ field: 'race.groupLevelName', comparator: '=', value: 'Group 3', type: 'Text' }].concat(baseSprint);
    mainRanker.pointAllotments = mainRanker.pointAllotments
        .concat(rankingSystemService.generateAllotmentSet([70, 35, 20, 15, 10, 8, 7, 6], group1Sprint))
        .concat(rankingSystemService.generateAllotmentSet([40, 25, 15, 10, 8, 7, 6, 5], group2Sprint))
        .concat(rankingSystemService.generateAllotmentSet([25, 16, 12, 8, 6, 5, 4, 3], group3Sprint));

    // stay groups
    const baseStay = [{ field: 'race.distanceMeters', comparator: '>=', value: 595, type: 'Number' }];
    const group1Stay = [{ field: 'race.groupLevelName', comparator: '=', value: 'Group 1', type: 'Text' }].concat(baseStay);
    const group2Stay = [{ field: 'race.groupLevelName', comparator: '=', value: 'Group 2', type: 'Text' }].concat(baseStay);
    const group3Stay = [{ field: 'race.groupLevelName', comparator: '=', value: 'Group 3', type: 'Text' }].concat(baseStay);
    mainRanker.pointAllotments = mainRanker.pointAllotments
        .concat(rankingSystemService.generateAllotmentSet([50, 25, 16, 12, 8, 6, 4, 2], group1Stay))
        .concat(rankingSystemService.generateAllotmentSet([30, 20, 12, 8, 6, 4, 2, 1], group2Stay))
        .concat(rankingSystemService.generateAllotmentSet([20, 14, 10, 6, 4, 3, 2, 1], group3Stay));

    return mainRanker;
};

rankingSystemService.generateAllotmentSet = function (pointArray, defaultCriteria) {
    return pointArray.map((pointValue, index) => {
        const newCriteria = defaultCriteria.slice();
        newCriteria.push({ field: 'placing', comparator: '=', value: (index + 1).toString(), type: 'Text' });
        return {
            points: pointValue,
            criteria: newCriteria
        };
    });
};
