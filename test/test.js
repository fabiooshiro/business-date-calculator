var BusinessDateCalculator = require('../bdc.js');
var assert = require('assert');
describe('BusinessDateCalculator', function() {
    it('should returns the calendar starting on friday', function() {
        var bdc = BusinessDateCalculator('2017-01-01', '2017-01-31', []);
        assert.equal(bdc.startDate, '2016-12-30');
    });
    it('should returns the calendar ending on monday', function() {
        var bdc = BusinessDateCalculator('2017-01-01', '2017-01-14', []);
        assert.equal(bdc.endDate, '2017-01-16');
    });
    describe('.isHoliday', function() {
        it('should returns true when the date is sunday', function() {
            var bdc = BusinessDateCalculator('2017-01-01', '2017-01-31', []);
            assert.equal(bdc.isHoliday('2017-01-01'), true);
        });
        it('should returns false when the date is monday', function() {
            var bdc = BusinessDateCalculator('2017-01-01', '2017-01-31', []);
            assert.equal(bdc.isHoliday('2017-01-02'), false);
        });
        it('should returns true when the date is saturday', function() {
            var bdc = BusinessDateCalculator('2017-01-01', '2017-01-31', []);
            assert.equal(bdc.isHoliday('2017-01-07'), true);
        });
        it('should returns true when the date is holiday', function() {
            var bdc = BusinessDateCalculator('2017-01-01', '2017-01-31', ['2017-01-03']);
            assert.equal(bdc.isHoliday('2017-01-03'), true);
        });
    });
    describe('.getNumberOfBusinessDaysBetween', function() {
        it('should returns 4 between 2017-01-02 2017-01-05', function() {
            var bdc = BusinessDateCalculator('2017-01-01', '2017-01-31', []);
            assert.equal(bdc.getNumberOfBusinessDaysBetween('2017-01-02', '2017-01-05', 'unadjusted', 'unadjusted'), 4);
        });
        it('should returns 3 between 2017-01-02 2017-01-05 cuz I declare 03 a holiday', function() {
            var bdc = BusinessDateCalculator('2017-01-01', '2017-01-31', ['2017-01-03']);
            assert.equal(bdc.getNumberOfBusinessDaysBetween('2017-01-02', '2017-01-05', 'unadjusted', 'unadjusted'), 3);
        });
        it('should returns 3 between 2017-01-01 2017-01-05 cuz I declare 03 a holiday', function() {
            var bdc = BusinessDateCalculator('2017-01-01', '2017-01-31', ['2017-01-03']);
            assert.equal(bdc.getNumberOfBusinessDaysBetween('2017-01-01', '2017-01-05', 'following', 'unadjusted'), 3);
        });
        it('should returns 4 between 2017-01-01 2017-01-08 cuz I declare 03 a holiday', function() {
            var bdc = BusinessDateCalculator('2017-01-01', '2017-01-31', ['2017-01-03']);
            assert.equal(bdc.getNumberOfBusinessDaysBetween('2017-01-01', '2017-01-08', 'following', 'preceding'), 4);
        });
        it('should returns 3 between 2017-01-01 2017-01-08 cuz I declare 03 a holiday', function() {
            var bdc = BusinessDateCalculator('2017-01-01', '2017-01-31', ['2017-01-03']);
            assert.equal(bdc.getNumberOfBusinessDaysBetween('2017-01-01', '2017-01-08', 'following', 'preceding'), 4);
        });
        it('should returns 0 between jan 07 and jan 08', function() {
            var bdc = BusinessDateCalculator('2017-01-01', '2017-01-31', ['2017-01-03']);
            assert.equal(bdc.getNumberOfBusinessDaysBetween('2017-01-07', '2017-01-08', 'following', 'preceding'), 0);
        });
        it('should returns 1 between jan 06 and jan 08', function() {
            var bdc = BusinessDateCalculator('2017-01-01', '2017-01-31', ['2017-01-03']);
            assert.equal(bdc.getNumberOfBusinessDaysBetween('2017-01-06', '2017-01-08', 'following', 'preceding'), 1);
        });
    });
    describe('.networkdays', function() {
        it('works like excel', function() {
            var bdc = BusinessDateCalculator('2017-01-01', '2017-01-31', ['2017-01-03']);
            assert.equal(bdc.networkdays('2017-01-08', '2017-01-07'), 0);
        });
        it('works like excel 2', function() {
            var bdc = BusinessDateCalculator('2017-01-01', '2017-01-31', ['2017-01-03']);
            assert.equal(bdc.networkdays('2017-01-02', '2017-01-02'), 1);
        });
        it('is fast like roadrunner', function() {
            var bdc = BusinessDateCalculator('2017-01-01', '2017-01-31', ['2017-01-03']);
            for (var i = 0; i < 100000; i++) {
                bdc.networkdays('2017-01-02', '2017-01-31');
            }
        });
    });
});