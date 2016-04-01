/**
 * @module fw/source/ChartSource
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var AjaxError = require('../error/AjaxError');
var AjaxSource = require('../source/AjaxSource');
var DataSource = require('../source/DataSource');
var FwAjax = require('../net/Ajax');
var FwChart = require('../ui/chart/Chart');
var FwPromise = require('../Promise');
var SourceError = require('../error/SourceError');
var FwTimestamp = require('../type/Timestamp');
var types = require('../types');
var utils = require('../utils');

/**
 * Create an instance of fw/source/ChartSource associated chartingelements
 * @class
 * @alias module:fw/source/ChartSource
 * @augments fw/source/AjaxSource
 * @param {Object} config - the configuration object of the ChartSource
 * @param {string} config.url - the URL of ajax request
 * @param {Object} [config.parameters] - optional parameters sent in each ajax request
 * @param {number} [config.timeout] - timeout of the request* 
 */
class ChartSource extends AjaxSource {
    /**
     * @constructor
     */
    constructor(config) {
        var self = this;

        AjaxSource.super(config);

        this.series = [];
        this.limits = [];
        this.charts = [];
        this.xTimestamp = false;

        this.beforeDone(function() {
            var n, l;

            for (n = 0, l = self.charts.length; n < l; n++) {
                self.charts[n].synchronize('beforeLoad');
            }
        }).done(function(response) {
            var data = response.data || {};
            var n, l;

            self.setSource(data);

            for (n = 0, l = self.charts.length; n < l; n++) {
                self.charts[n].synchronize('load');
            }           
        }).fail(function(error) {
            var n, l;

            for (n = 0, l = self.charts.length; n < l; n++) {
                self.charts[n].synchronize('beforeLoad');
            }

            throw error;
        });
    }
    /**
     * Bind chart(s) to the ChartSource
     * @method bind
     * @param {fw/ui/chart/Chart|fw/ui/chart/Chart[]} chart(s) - chart or array of charts to bind to the ChartSource
     */
    bind() {
        var self = this;
        var charts = arguments[0];
        var n, l, chart;
        // Process chart
        function processChart(chart) {
            if (chart instanceof FwChart) {
                if ((chart.chartSource !== self) && (chart.chartSource instanceof ChartSource)) { chart.chartSource.unbind(chart); }

                if (self.charts.indexOf(chart) === -1) {
                    self.charts.push(chart);
                    chart.chartSource = self;
                }
            }
        }

        if (charts instanceof Array) {
            for (n = 0, l = charts.length; n < l; n++) {
                processChart(charts[n]);
            }
        } else {
            processChart(arguments[0]);
        }
    }
    /**
     * Unbind chart(s) from the ChartSource
     * @method unbind
     * @param {fw/ui/chart/Chart|fw/ui/chart/Chart[]} chart(s) - chart or array of charts to unbind from the ChartSource
     */
    unbind() {
        var self = this;
        var charts = arguments[0];
        var n, l, chart;
        // Process chart
        function processChart(chart) {
            var index;

            if (chart instanceof FwChart) {
                index = self.charts.indexOf(index);

                if (index !== -1) {
                    chart.chartSource.abort();
                    self.charts.splice(index, 1);
                    chart.chartSource = null;
                }
            }
        }

        if (charts instanceof Array) {
            for (n = 0, l = charts.length; n < l; n++) {
                processChart(charts[n]);
            }
        } else {
            processChart(arguments[0]);
        }
    }
    /**
     * Set data to the source
     * @method setSource
     * @param {Object} data - data to be stored
     * @param {Object[]} [data.series] - series to be stored
     * @param {string} [series[].name] - name of the serie ("serie1", "serie2", ...)
     * @param {Object[]} series[].list - list of values
     * @param {number|Date|fw/type/Timestamp} series[].list[].x - value of x (number, date or fw/type/Timestamp)
     * @param {boolean} series[].list[].xTimestamp - set the x values to timestamp format
     * @param {number} series[].list[].y - value of y
     * @param {Object[]} [data.limits] - limits to be stored
     * @param {string} [limits[].name] - name of the limit ("limit1", "limit2", ...)
     * @param {number} [limits[].value] - value of the limit
     * @return {fw/Promise}
     */
    setSource(data) {
        data = data || {};

        var self = this;

        this.xTimestamp = false;
        this.series = data.series || [];
        this.limits = data.limits || [];
        this.showSpinners();

        return new FwPromise(function(resolve) {
            window.setTimeout(function () {
                var xMin = null;
                var xMax = null;
                var yMin = null;
                var yMax = null;
                var count, x, y, n, l, i, j, limit, serie;

                count = 1;
                // Set automatic names for limits if not specified
                for (n = 0, l = self.limits.length; n < l; n++) {
                    limit = self.limits[n];

                    if (!types.isString(limit.name)) {
                        limit.name = 'limit' + count;
                        count++;
                    }
                }

                count = 1;
                // Process the series
                for (n = 0, l = self.series.length; n < l; n++) {
                    // Set automatic name if not specified
                    serie = self.series[n];
                    serie.list = serie.list || [];

                    if (!types.isString(serie.name)) {
                        serie.name = 'serie' + count;
                        count++;
                    }
                    // Reset minimum and maximum values
                    serie.xMin = null;
                    serie.xMax = null;
                    serie.yMin = null;
                    serie.yMax = null;
                    j = serie.list.length;

                    if (j > 0) {
                        // Proccess date formatted values
                        if (serie.xTimestamp) {
                            if (!self.xTimestamp && count > 1) {
                                throw new SourceError({
                                    sourceName: 'fw/source/ChartSource',
                                    message:    'x data of serie "' + serie.name + '" must have a number format',
                                    origin:     'setSource method'
                                });
                            }

                            self.xTimestamp = true;
                            x = new FwTimestamp(serie.list[0].x).toTime();
                            y = serie.list[0].y;

                            if (x !== null) {
                                serie.list[0].x = xMin = xMax = x;
                            }

                            if (types.isNumber(y)) {
                                yMin = yMax = y;
                            }

                            for (i = 1; i < j; i++) {
                                x = new FwTimestamp(serie.list[i].x).toTime();
                                y = serie.list[i].y;

                                if (x !== null && types.isNumber(y)) {
                                    serie.list[i].x = x;

                                    if (xMin === null) {
                                        xMin = xMax = x;
                                    } else {
                                        if (xMin > x) { xMin = x; }
                                        if (xMax < x) { xMax = x; }
                                        if (yMin > y) { yMin = y; }
                                        if (yMax < y) { yMax = y; }
                                    }
                                }
                            }
                        }
                        // Proccess number formatted values
                        else {
                            if (self.xTimestamp) {
                                throw new SourceError({
                                    sourceName: 'fw/source/ChartSource',
                                    message:    'x data of serie "' + serie.name + '" must have a timestamp format',
                                    origin:     'setSource method'
                                });                               
                            }

                            xMin = xMax = serie.list[0].x;
                            yMin = yMax = serie.list[0].y;

                            for (i = 1; i < j; i++) {
                                x = serie.list[i].x;
                                y = serie.list[i].y;

                                if (types.isNumber(x) && types.isNumber(y)) {
                                    if (xMin > x) { xMin = x; }
                                    if (xMax < x) { xMax = x; }
                                    if (yMin > y) { yMin = y; }
                                    if (yMax < y) { yMax = y; }
                                }
                            }
                        }
                        // Store minimum and maximum value in the serie
                        serie.xMin = xMin;
                        serie.xMax = xMax;
                        serie.yMin = yMin;
                        serie.yMax = yMax;
                        // Sort values
                        serie.list.sort(function (a, b) {
                            return a.x - b.x;
                        });
                    }
                }
                // Redraw all registered charts in the ChartSource
                for (n = 0, l = self.charts.length; n < l; n++) {
                    self.charts[n].draw();
                }

                resolve({ series: self.series, limits: self.limits });
            }, 0);
        });
    }
    /**
     * Clear the ChartSource
     * @method clear
     */
    clear() {
        this.setSource();
    }
}

module.exports = ChartSource;
