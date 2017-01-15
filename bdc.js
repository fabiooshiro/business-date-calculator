(function() {
    var moment = require('moment');
    
    var SATURDAY = 6, SUNDAY = 0;
    
    module.exports = BusinessDateCalculator;

    return;
    
    function BusinessDateCalculator(startDate, endDate, holidays) {
        var obj = {};
        obj.startDate = startDate;
        obj.endDate = endDate;
        obj.holidays = holidays;
        /**
         * Array com os dias uteis, começando de uma data base arbitraria
         */
        obj.businessDates = [];

        /**
         * Mapa cuja chave é um LocalDate dia útil e o valor é o índice no array acima.
         */
        obj.businessDateIndex = {};

        /**
         * Mapa cuja chave é um LocalDate que não é dia útil, e o valor é o índice no array acima do dia útil seguinte.
         */
        obj.nextBusinessDateIndex = {};

        /**
         * Mapa cuja chave é um LocalDate que não é dia útil, e o valor é o índice no array acima do dia útil anterior.
         */
        obj.prevBusinessDateIndex = {};

        /**
         * Constroi a estrutura de dados a partir de uma lista de LocalDate's que
         * sao os feriados, e usando um periodo especificado (fechado nas duas pontas).
         */
        build(startDate, endDate, holidays);

        obj.isHoliday = isHoliday;

        obj.getAdjustedDateIndex = getAdjustedDateIndex;

        obj.adjust = adjust;

        obj.advanceBusinessDays = advanceBusinessDays;

        obj.getNumberOfBusinessDaysBetween = getNumberOfBusinessDaysBetween;
        
        obj.networkdays = networkdays;

        return obj;
        
        function networkdays(startDate, endDate) {
            return obj.getNumberOfBusinessDaysBetween(startDate, endDate, 'following', 'preceding');
        }

        function build(startDate, endDate, holidays) {
            // garante que startDate e endDate sao dias uteis
            var dayOfWeek = moment(startDate).day();
            while (dayOfWeek == SATURDAY || dayOfWeek == SUNDAY || holidays.indexOf(startDate) != -1) {
                startDate = moment(startDate).subtract(1, 'day').format('YYYY-MM-DD');
                dayOfWeek = moment(startDate).day();
            }
            dayOfWeek = moment(endDate).day();
            while (dayOfWeek == SATURDAY || dayOfWeek == SUNDAY || holidays.indexOf(endDate) != -1) {
                endDate = moment(endDate).add(1, 'day').format('YYYY-MM-DD');
                dayOfWeek = moment(endDate).day();
            }
            obj.startDate = startDate;
            obj.endDate = endDate;
            obj.holidays = holidays;
            obj.businessDates = [];
            obj.businessDateIndex = {};
            obj.nextBusinessDateIndex = {};
            obj.prevBusinessDateIndex = {};

            var d = startDate;
            var i = 0;
            while (d <= endDate) {
                dayOfWeek = moment(d).day();
                if (dayOfWeek != SATURDAY && dayOfWeek != SUNDAY && holidays.indexOf(d) == -1) {
                    // dia util, adiciona ao final do array, e mapeia o indice do array no mapa
                    obj.businessDates.push(d);
                    obj.businessDateIndex[d] = i;
                    i++;
                }
                else {
                    // dia não útil, mapeia o indice do dia util anterior e proximo
                    obj.nextBusinessDateIndex[d] = i;
                    obj.prevBusinessDateIndex[d] = i - 1;
                }
                d = moment(d).add(1, 'day').format('YYYY-MM-DD');
            }
        }

        /**
         * Verifica se a data passada esta entre o periodo desta instancia.
         * Caso contrario lanca um ArrayIndexOutOfBoundsException.
         */
        function rangeCheck(date) {
            if (date < startDate) {
                console.log("Reconstruindo calculadora de feriados pois dia ${date} eh menor que ${startDate}");
                build(date, endDate, holidays);
            }
            else if (date > endDate) {
                console.log("Reconstruindo calculadora de feriados pois dia ${date} eh maior que ${endDate}");
                build(startDate, date.plusDays(252), holidays);
            }
        }

        /**
         * Retorna true se for feriado ou fim de semana, e false se for dia util.
         */
        function isHoliday(date) {
            rangeCheck(date);
            return obj.businessDateIndex[date] == undefined;
        }

        function getAdjustedDateIndex(date, convention) {
            return obj.businessDateIndex[obj.adjust(date, convention)];
        }

        /**
         * Retorna o numero de dias uteis entre as duas data especificadas, inclusive.
         * As duas datas devem ser dias uteis, ou caso não seja, deve ser 
         * especificado uma convenção de ajuste para cada data.
         * A primeira data deve ser menor ou igual a segunda.
         */
        function getNumberOfBusinessDaysBetween(date1, date2, convention1, convention2) {
            rangeCheck(date1);
            rangeCheck(date2);
            var i1 = obj.getAdjustedDateIndex(date1, convention1);
            var i2 = obj.getAdjustedDateIndex(date2, convention2);

            if (isNaN(i1)) {
                // XXX: lancar que excecao?
                throw "Adjusted date " + date1 + " is out of range";
            }
            if (isNaN(i2)) {
                // XXX: lancar que excecao?
                throw "Adjusted date " + date2 + " is out of range";
            }
            return i2 - i1 + 1;
        }

        function adjust(date, convention) {
            convention = convention || 'unadjusted';
            rangeCheck(date);
            if (!isHoliday(date)) {
                return date;
            }
            else if (convention == 'unadjusted') {
                console.log("Convencao eh UNADJUSTED");
                return date;
            }
            else {
                if (convention == 'following') {
                    return obj.businessDates[obj.nextBusinessDateIndex[date]];
                }
                else if (convention == 'preceding') {
                    if (obj.prevBusinessDateIndex[date] == null) {
                        console.log("Erro pegando data util anterior ao dia ${date} (${date.chronology}), calculadora de [${startDate},${endDate}]");
                        console.log("Feriado: ${holidays.contains(date)}");
                        console.log("businessDateIndex['${date}']: ${businessDateIndex[date]}");
                    }
                    return obj.businessDates[obj.prevBusinessDateIndex[date]];
                }
                else if (convention == 'modified_following') {
                    var next = obj.businessDates[obj.nextBusinessDateIndex[date]];
                    if (next.monthOfYear != date.monthOfYear) {
                        return obj.businessDates[obj.prevBusinessDateIndex[date]];
                    }
                    else {
                        return next;
                    }
                }
                else if (convention == 'modified_preceding') {
                    var prev = obj.businessDates[obj.prevBusinessDateIndex[date]];
                    if (prev.monthOfYear != date.monthOfYear) {
                        return obj.businessDates[obj.nextBusinessDateIndex[date]];
                    }
                    else {
                        return prev;
                    }
                }
            }
        }

        function advanceBusinessDays(date, n, convention) {
            rangeCheck(date);
            obj.businessDates[obj.getAdjustedDateIndex(date, convention) + n];
        }

        /*
        enum BusinessDayConvention {
        	FOLLOWING, // Choose the first business day after the given holiday
        	MODIFIED_FOLLOWING, // Choose the first business day after the given holiday unless it belongs to a different month, in which case choose the first business day before the holiday
        	MODIFIED_PRECEDING, // Choose the first business day before the given holiday unless it belongs to a different month, in which case choose the first business day after the holiday
        	MONTH_END_REFERENCE, // Choose the first business day after the given holiday, if the original date falls on last business day of month result reverts to first business day before month-end
        	PRECEDING, // Choose the first business day before the given holiday
        	UNADJUSTED // Do not adjust
        }
        */
    }
})();