/**
 * @module fw/ui/chart/ScatterChart
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var Chart = require('./Chart');
var ChartSource = require('../../source/ChartSource');
var fw = require('../../Core');
var FwNumber = require('../../type/Number');
var FwTimestamp = require('../../type/Timestamp');

var DEFAULT_CHART_HEIGHT = 500;
var DEFAULT_CHART_WIDTH = 500;

// Get tick value
function getTick(magicValues, value) {
    var minDiff = null;
    var magicValue, diff, tick, n, l;

    for (n = 0, l = magicValues.length; n < l; n++) {
        magicValue = magicValues[n];
        diff = Math.abs(magicValue - value);

        if (minDiff === null) {
            minDiff = diff;
            tick = magicValue;
        } else if (diff < minDiff) {
            minDiff = diff;
            tick = magicValue;
        }
    }

    return tick;
}
// Get time range
function getTimeRange(min, max, density) {
    var second = 1000;
    var minute = 60000;
    var hour = 3600000;
    var day = 86400000;
    var week = 604800000;
    var month = 2419200000;
    var year = 31536000000;
    var minDate, maxDate, diff, value, tick, tickNumber, factor;

    function addStepToDate(date, step) {
        return new Date(
            Date.UTC(
                date.getUTCFullYear() + (step[0] || 0),
                date.getUTCMonth() + (step[1] || 0),
                date.getUTCDate() + (step[2] || 0),
                date.getUTCHours() + (step[3] || 0),
                date.getUTCMinutes() + (step[4] || 0),
                date.getUTCSeconds() + (step[5] || 0),
                date.getUTCMilliseconds() + (step[6] || 0)
            )
        );
    }

    function deleteStepToDate(date, step) {
        return new Date(
            Date.UTC(
                date.getUTCFullYear() - (step[0] || 0),
                date.getUTCMonth() - (step[1] || 0),
                date.getUTCDate() - (step[2] || 0),
                date.getUTCHours() - (step[3] || 0),
                date.getUTCMinutes() - (step[4] || 0),
                date.getUTCSeconds() - (step[5] || 0),
                date.getUTCMilliseconds() - (step[6] || 0)
            )
        );
    }

    function createDateRange(startDate, step) {
        var range = [];
        var labels = [];
        var firstRangeTruncated = false;
        var lastRangeTruncated = false;
        var DATETIMEMILLILABEL = 0;
        var DATETIMELABEL = 1;
        var DATELABEL = 2;
        var currentDate, previousDate, el, labelType;
        var n, l;

        function getLabel(date) {
            var timestamp = new FwTimestamp(date);

            switch (labelType) {
                case DATETIMEMILLILABEL:
                    return [timestamp.toDMYString(), timestamp.toHMSMSString()];
                case DATETIMELABEL:
                    return [timestamp.toDMYString(), timestamp.toHMSString()];
                default:
                    return [timestamp.toDMYString()];
            }
        }

        for (n = step.length - 1; n >= 0; n--) {
            if (step[n] !== 0) break;
        }

        if (n === 6) {
            labelType = DATETIMEMILLILABEL;
        } else if (n > 2) {
            labelType = DATETIMELABEL;
        } else {
            labelType = DATELABEL;
        }

        currentDate = new Date(startDate.getTime());

        if (min > currentDate.getTime()) {
            previousDate = currentDate;
            currentDate = addStepToDate(startDate, step);
        } else {
            previousDate = deleteStepToDate(currentDate, step);
        }

        if (min < currentDate.getTime()) {
            firstRangeTruncated = true;
            labels.push({ value: min, label: [] });
        }

        do {
            labels.push({ value: currentDate.getTime(), label: getLabel(currentDate) });
            previousDate = currentDate;
            currentDate = addStepToDate(currentDate, step);
        } while (currentDate.getTime() <= maxDate.getTime());

        if (previousDate.getTime() !== maxDate.getTime()) {
            lastRangeTruncated = true;
            labels.push({ value: maxDate.getTime(), label: [] });
        }

        for (n = 0, l = labels.length - 1; n < l; n++) {
            el = {
                min:    labels[n],
                max:    labels[n + 1],
                size:   (labels[n + 1].value - labels[n].value)
            };

            if (n === 0 && firstRangeTruncated) {
                el.weight = el.size / (labels[n + 1].value - (deleteStepToDate(new Date(labels[n + 1].value), step).getTime()));
            } else if (n === l - 1 && lastRangeTruncated) {
                el.weight = el.size / (addStepToDate(new Date(labels[n].value), step).getTime() - labels[n].value);
            } else {
                el.weight = 1;
            }

            range.push(el);
        }

        return range;
    }

    if (min === null) {
        return { value: min, label: [] };
    } else if (min === max) {
        min = min - 1;
        max = max + 1;
    } else if (max - min === 1) {
        min = min - 1;
    }

    minDate = new Date(min);
    maxDate = new Date(max);
    diff = max - min;
    value = diff / density;

    if (value > second) { minDate.setUTCMilliseconds(0); }
    if (value > minute) { minDate.setUTCSeconds(0); }
    if (value > hour)   { minDate.setUTCMinutes(0); }
    if (value > day)    { minDate.setUTCHours(0); }
    if (value > month)  { minDate.setUTCDate(1); }
    if (value > year)   { minDate.setUTCMonth(0); }

    if (value < second) {
        tick = getTick([1, 2, 5, 10, 20, 50, 100, 200, 500], value);
        minDate.setUTCMilliseconds(Math.ceil(new Date(min).getUTCMilliseconds() / tick) * tick);
        return createDateRange(minDate, [0, 0, 0, 0, 0, 0, tick]);
    } else if (value < minute) {
        tick = getTick([1, 2, 5, 10, 15, 20, 30], value / second);
        minDate.setUTCSeconds(Math.ceil(new Date(min).getUTCSeconds() / tick) * tick);
        return createDateRange(minDate, [0, 0, 0, 0, 0, tick, 0]);
    } else if (value < hour) {
        tick = getTick([1, 2, 5, 10, 20, 30], value / minute);
        minDate.setUTCMinutes(Math.ceil(new Date(min).getUTCMinutes() / tick) * tick);
        return createDateRange(minDate, [0, 0, 0, 0, tick, 0, 0]);
    } else if (value < day) {
        tick = getTick([1, 2, 4, 6, 8, 10, 12], value / hour);
        minDate.setUTCHours(Math.ceil(new Date(min).getUTCHours() / tick) * tick);
        return createDateRange(minDate, [0, 0, 0, tick, 0, 0, 0]);
    } else if (value < week) {
        tick = getTick([1, 2, 4], value / day);
        return createDateRange(minDate, [0, 0, tick, 0, 0, 0, 0]);
    } else if (value < month) {
        tick = getTick([1, 2], value / week);
        minDate.setUTCDate(minDate.getUTCDate() - ((minDate.getUTCDay() + 6) % 7) + 7);
        return createDateRange(minDate, [0, 0, tick * 7, 0, 0, 0, 0]);
    } else if (value < year) {
        tick = getTick([1, 2, 3, 4, 6], value / month);
        minDate.setUTCMonth(Math.ceil(new Date(min).getUTCMonth() / tick) * tick);
        return createDateRange(minDate, [0, tick, 0, 0, 0, 0, 0]);
    } else {
        tickNumber = new FwNumber(value / year);
        tick = getTick([1, 2, 5, 10], tickNumber.getMantissa());
        factor = tick * Math.pow(10, tickNumber.getExponent());
        minDate.setUTCFullYear(Math.ceil(new Date(min).getUTCFullYear() / factor) * factor);
        return createDateRange(minDate, [factor, 0, 0, 0, 0, 0, 0]);
    }
}
// Get linear range
function getLinearRange(min, max, density, extended) {
    if (min === null || max === null) return { value: null, label: [] };

    var range = [];
    var labels = [];
    var firstRangeTruncated = false;
    var lastRangeTruncated = false;
    var diff = max - min;
    var el, previousValue, value;
    var n, l, tick, tickNumber;

    if (diff === 0) {
        return { value: min, label: [new FwNumber(min).toString()] };
    } else {
        tickNumber = new FwNumber(diff / density);
        tick = getTick([1, 2, 2.5, 5, 10], Math.abs(tickNumber.getMantissa())) * Math.pow(10, tickNumber.getExponent());

        if (extended) {
            n = Math.floor(min / tick);
            l = Math.ceil(max / tick);

            for (; n <= l; n++) {
                value = n * tick;
                labels.push({ value: value, label: [new FwNumber(value).toString()] });
            }
        } else {
            value = Math.ceil(min / tick) * tick;

            if (min > value) {
                previousValue = value;
                value += tick;
            } else {
                previousValue = value - tick;
            }

            if (min < value) {
                labels.push({ value: min, label: [] });
                firstRangeTruncated = true;
            }

            do {
                labels.push({ value: value, label: [new FwNumber(value).toString()] });
                previousValue = value;
                value += tick;
            } while (value <= max);

            if (previousValue !== max) {
                lastRangeTruncated = true;
                labels.push({ value: max, label: [] });
            }
        }
    }

    for (n = 0, l = labels.length - 1; n < l; n++) {
        el = {
            min:    labels[n],
            max:    labels[n + 1],
            size:   (labels[n + 1].value - labels[n].value)
        };

        el.weight = ((n === 0 && firstRangeTruncated) || (n === l - 1 && lastRangeTruncated)) ? el.size / tick : 1;
        range.push(el);
    }

    return range;
}
/**
 * @typedef serieConfig
 * @param {string} [type="line"] - line drawing pattern ("line", "scatter")
 * @param {function} [tooltipTemplate] - function(data) return the tooltip template
 */
/**
 * Create a scatter chart which uses the fw/ui/chart/ScatterChart as model source
 * @class
 * @alias module:fw/ui/chart/ScatterChart
 * @augments fw/ui/chart/Chart
 * @param {Object} [config] - the configuration object parameter
 * @param {Object} [config.i18n] - the dictionary which contains the translations
 * @param {fw/source/ChartSource} [config.chartSource=null] - scatter chart source
 *
 * @param {number} [config.marginLeft=10] - size of the left margin
 * @param {number} [config.marginRight=10] - size of the right margin
 * @param {number} [config.marginTop=10] - size of the top margin
 * @param {number} [config.marginBottom=10] - size of the bottom margin
 *
 * @param {Object} [config.title] - title configuration
 * @param {string} [config.title.text] - title text
 * @param {number} [config.title.marginTop=10] - size of the title top margin
 * @param {number} [config.title.marginBottom=10] - size of the title bottom margin
 * @param {Object} [config.title.font] - title font configuration
 * @param {string} [config.title.font.name=Arial] - title font name
 * @param {number} [config.title.font.size=14] - title font size
 * @param {string} [config.title.font.weight=bold] - title font weight
 * @param {number} [config.title.font.interlineSpacing=3] - title interline spacing
 *
 * @param {Object} [config.series] - series configuration
 * @param {Object.<string, serieConfig>} [config.series.*]
 *
 * @param {Object} [config.tooltip] - tooltip configuration
 * @param {number} [config.tooltip.marginTop=10] - size of tooltip top margin
 * @param {number} [config.tooltip.marginBottom=10] - size of tooltip bottom margin
 * @param {number} [config.tooltip.marginLeft=10] - size of tooltip left margin
 * @param {number} [config.tooltip.marginRight=10] - size of tooltip right margin
 * @param {Object} [config.tooltip.font] - tooltip font configuration
 * @param {string} [config.tooltip.font.name=Arial] - tooltip font name
 * @param {number} [config.tooltip.font.size=12] - tooltip font size
 * @param {number} [config.tooltip.font.interlineSpacing=2] - tooltip font interline spacing
 *
 * @param {Object} [config.xAxis] - x axis configuration
 * @param {Object} [config.xAxis.density=5] - x axis density
 * @param {Object} [config.xAxis.labels] - x axis labels configuration
 * @param {number} [config.xAxis.labels.marginTop=10] - size of the x axis labels top margin
 * @param {Object} [config.xAxis.labels.font] - x axis font labels configuration
 * @param {string} [config.xAxis.labels.font.name=Arial] - x axis font labels name
 * @param {number} [config.xAxis.labels.font.size=10] - x axis font labels size
 * @param {number} [config.xAxis.labels.font.interlineSpacing=3] - x axis font labels interline spacing
 *
 * @param {Object} [config.xAxis.title] - x axis title configuration
 * @param {number} [config.xAxis.title.marginTop=10] - size of the x axis title top margin
 * @param {number} [config.xAxis.title.marginBottom=10] - size of the x axis title bottom margin
 * @param {Object} [config.xAxis.title.font] - x axis font title configuration
 * @param {string} [config.xAxis.title.font.name=Arial] - x axis title labels name
 * @param {number} [config.xAxis.title.font.size=12] - x axis font title size
 * @param {number} [config.xAxis.title.font.weight=bold] - x axis font title weight
 * @param {number} [config.xAxis.title.font.interlineSpacing=3] - x axis font title interline spacing
 *
 * @param {Object} [config.yAxis] - y axis configuration
 * @param {Object} [config.yAxis.density=5] - y axis density
 * @param {Object} [config.yAxis.labels] - y axis labels configuration
 * @param {number} [config.yAxis.labels.marginTop=10] - size of the y axis labels top margin
 * @param {Object} [config.yAxis.labels.font] - y axis font labels configuration
 * @param {string} [config.yAxis.labels.font.name=Arial] - y axis font labels name
 * @param {number} [config.yAxis.labels.font.size=10] - y axis font labels size
 * @param {number} [config.yAxis.labels.font.interlineSpacing=3] - y axis font labels interline spacing
 *
 * @param {Object} [config.yAxis.title] - y axis title configuration
 * @param {number} [config.yAxis.title.marginTop=10] - size of the y axis title top margin
 * @param {number} [config.yAxis.title.marginBottom=10] - size of the y axis title bottom margin
 * @param {Object} [config.yAxis.title.font] - y axis font title configuration
 * @param {string} [config.yAxis.title.font.name=Arial] - y axis title labels name
 * @param {number} [config.yAxis.title.font.size=12] - y axis font title size
 * @param {number} [config.yAxis.title.font.weight=bold] - y axis font title weight
 * @param {number} [config.yAxis.title.font.interlineSpacing=3] - y axis font title interline spacing
 */
class FwScatterChart extends Chart {
    /**
     * Define scatter chart tagName
     * @property tagName
     */
    static tagName = 'fw-scatterchart'; // jshint ignore:line
    /**
     * Define scatter chart className
     * @property className
     */
    static className = 'fw-scatterchart'; // jshint ignore line
    /**    
     * Initialize the scatter chart element
     * @method initialize
     * @private
     */
    initialize() {
        this.activateSpinner = false;
        this.chartData = {};
        this.series = this.config.series || {};

        this.limitColors = ['#FFFF3E', '#DC0000', '#009100', '#0084C8', '#ECCD84'];
        this.pathColors = ['#20598D', '#28543D', '#A82626', '#EDC309', '#946F47', '#1F4963', '#A82626', '#E06F33', '#CFFAC1', '#568194', '#AA5555', '#4C7587'];
        this.pointColors = ['#004779', '#01472B', '#910F0F', '#D8B100', '#77562F', '#01334C', '#910F0F', '#CE6023', '#AFB9A1', '#477183', '#913E40', '#2E586A'];

        this.mousedown = false;
        this.zoomable = this.config.zoomable || false;
        this.zoomStartX = 0;
        this.zoomWidth = 0;
        this.dataOver = null;
        this.compressedData = {};
        this.tooltipData = {};

        this.chartInfo = {
            height:         DEFAULT_CHART_HEIGHT,
            width:          DEFAULT_CHART_WIDTH,
            marginLeft:     this.config.marginLeft || 10,
            marginRight:    this.config.marginRight || 10,
            marginTop:      this.config.marginTop || 10,
            marginBottom:   this.config.marginBottom || 10,
            title:          fw.copyObject({
                text:                   null,
                font:                   {
                    name:                   'Arial',
                    size:                   14,
                    weight:                 'bold',
                    interlineSpacing:       3
                },
                marginTop:              10,
                marginBottom:           10
            }, this.config.title),
            xAxis:          fw.copyObject({
                labels:                 {
                    font:                   {
                        name:                   'Arial',
                        size:                   10,
                        interlineSpacing:       3
                    },
                    marginTop:              10
                },
                title:                  {
                    text:                   null,
                    font:               {
                        name:               'Arial',
                        size:               12,
                        weight:             'bold',
                        interlineSpacing:   3
                    },
                    marginTop:              10,
                    marginBottom:           10
                },
                top:                    0,
                left:                   0,
                range:                  [],
                density:                5
            }, this.config.xAxis),
            yAxis:          fw.copyObject({
                labels:                 {
                    font:                   {
                        name:                   'Arial',
                        size:                   10,
                        interlineSpacing:       3
                    },
                    marginRight:            10
                },
                title: {
                    text:                   null,
                    font:                   {
                        name:                   'Arial',
                        size:                   12,
                        weight:                 'bold',
                        interlineSpacing:       3
                    },
                    marginTop:              10,
                    marginBottom:           10,
                    size:                   {
                        height:                0,
                        width:                 0
                    }
                },
                bottom:                     0,
                right:                      0,
                range:                      [],
                density:                    5,
                onlyInteger:                false
            }, this.config.yAxis),
            series:         fw.copyObject({}, this.config.series)
        };

        this.tooltipNode = null;
        this.tooltip = fw.copyObject({
            font: {
                name:               'Arial',
                size:               12,
                interlineSpacing:   2 },
                marginTop:    10,
                marginBottom: 10,
                marginLeft:   10,
                marginRight:  10
        }, this.config.tooltip);

        this.ranges = null;
        this.sizes = null;
        this.chartSource = this.config.chartSource || null;
        // Define chartSource
        this.setChartSource(this.config.chartSource || this.chartSource);
    }
    /**
     * Define chart width
     * @method setChartWidth 
     * @param {string|number} width - chart width
     */
    setChartWidth(value) {
        var width;

        if (fw.isValidNumber(value)) {
            width = value;
        } else if (!fw.isEmptyString(value)) {
            width = parseFloat(value, 10) || DEFAULT_CHART_WIDTH;
        } else {
            width = DEFAULT_CHART_WIDTH;
        }

        this.chartInfo.width = width;

        if (this.isBound) {
            this.repaint();
        }
    }
    /**
     * Define chart height
     * @method setChartHeight
     * @param {string|number} height - chart height
     */
    setChartHeight(value) {
        var height;

        if (fw.isValidNumber(value)) {
            height = value;
        } else if (!fw.isEmptyString(value)) {
            height = parseFloat(value, 10) || DEFAULT_CHART_HEIGHT;
        } else {
            height = DEFAULT_CHART_HEIGHT;
        }

        this.chartInfo.height = height;

        if (this.isBound) {
            this.repaint();
        }
    }
    /**
     * Create the ScatterChart nodes
     * @method buildUI
     * @private
     */
    buildUI() {
        this.node = document.createElement('div');
        this.node.innerHTML = '\
            <div class="content">\
                <div class="size"><span></span></div>\
                <div class="fw-scatterchart-spinner"><div><div></div></div></div>\
            </div>';
        this.node.style.height = this.chartInfo.height + 'px';
        this.node.style.width = this.chartInfo.width + 'px';

        this.contentNode = this.node.getElementsByClassName('fw-scatterchart-content')[0];
        this.spinnerNode = this.node.getElementsByClassName('fw-scatterchart-spinner')[0];

        this.calculateSizeNode = this.node.getElementsByClassName('fw-scatterchart-size')[0];
        this.calculateSizeTextNode = this.calculateSizeNode.childNodes[0];

        this.chartCanvas = document.createElement('canvas');
        this.chartCanvas.classList.add('fw-scatterchart-canvas');
        this.chartCtx = this.chartCanvas.getContext('2d');
        this.chartInfo.context = this.chartCtx;
        this.chartCanvas.width = this.chartInfo.width;
        this.chartCanvas.height = this.chartInfo.height;
        this.contentNode.appendChild(this.chartCanvas);

        this.selectionCanvas = document.createElement('canvas');
        this.selectionCanvas.classList.add('fw-scatterchart-canvas');
        this.selectionCtx = this.selectionCanvas.getContext('2d');
        this.selectionCanvas.width = this.chartInfo.width;
        this.selectionCanvas.height = this.chartInfo.height;
        this.contentNode.appendChild(this.selectionCanvas);

        this.tooltipCanvas = document.createElement('canvas');
        this.tooltipCanvas.classList.add('fw-scatterchart-canvas');
        this.tooltipCtx = this.tooltipCanvas.getContext('2d');
        this.tooltipCanvas.width = this.chartInfo.width;
        this.tooltipCanvas.height = this.chartInfo.height;
        this.contentNode.appendChild(this.tooltipCanvas);
    }
    /**
     * Bind all events attached to the ScatterChart node
     * @method bindUI
     * @private
     */
    bindUI() {
        this.on('mousedown', this.onMouseDown);
        this.onWindowEvent('mousemove', this.onMouseMove);
        this.onWindowEvent('mouseup', this.onMouseUp);
        this.onAttributeChange('width', this.setChartWidth);
        this.onAttributeChange('height', this.setChartHeight);
    }
    /**
     * Mousedown event handler
     * @method onMouseDown
     * @private 
     */
    onMouseDown(e) {
        if (this.ranges === null) return;

        var offset, x, y;

        if (!this.mousedown && this.zoomable && this.ranges.xAxis instanceof Array) {
            offset = fw.getOffset(this.node);
            x = e.pageX - offset.left - this.chartInfo.xAxis.left;
            y = this.chartInfo.yAxis.bottom - e.pageY + offset.top;

            if (x > 0 && x < this.chartInfo.xAxis.width && y > 0 && y < this.chartInfo.yAxis.height) {
                this.mousedown = true;
                this.zoomStartX = x;
            }
        }

        e.preventDefault();
    }
    /**
     * Mousemove event handler
     * @method onMouseMove
     * @private 
     */
    onMouseMove(e) {
        var offset = fw.getOffset(this.node);
        var x = e.pageX - offset.left - this.chartInfo.xAxis.left;
        var y = this.chartInfo.yAxis.bottom - e.pageY + offset.top;
        var data, startX, width;

        if (this.mousedown) {
            this.dataOver = null;
            this.removeTooltip();

            if (x < 0) {
                x = 0;
            } else if (x > this.chartInfo.xAxis.width) {
                x = this.chartInfo.xAxis.width;
            }

            this.zoomWidth = x - this.zoomStartX;
            startX = Math.min(x, this.zoomStartX);
            width = Math.abs(this.zoomWidth);

            this.selectionCtx.save();
            this.selectionCtx.clearRect(0, 0, this.chartInfo.width, this.chartInfo.height);
            this.selectionCtx.fillStyle = '#9EBBC6';
            this.selectionCtx.globalAlpha = 0.5;
            this.selectionCtx.fillRect(this.chartInfo.xAxis.left + startX, this.chartInfo.yAxis.bottom - this.chartInfo.yAxis.height, width, this.chartInfo.yAxis.height);
            this.selectionCtx.stroke();
            this.selectionCtx.restore();
        } else if (e.target === this.tooltipCanvas) {
            data = this.fetchTooltip(x, y, 10);

            if (data !== undefined) {
                if (data !== this.dataOver) {
                    this.dataOver = data;
                    this.createTooltip(data);
                }
            } else {
                if (this.dataOver !== null) {
                    this.dataOver = null;
                    this.removeTooltip();
                }
            }
        } else {
            this.dataOver = null;
            this.removeTooltip();
        }
    }
    /**
     * Mousemove event handler
     * @method onMouseUp 
     * @private 
     */   
    onMouseUp() { 
        var zoomable = false;
        var xMin, xMax;

        if (this.mousedown) {
            if (this.zoomWidth !== 0) {
                zoomable = true;

                if (this.zoomWidth > 0) {
                    xMin = this.getValueFromX(this.zoomStartX);
                    xMax = this.getValueFromX(this.zoomStartX + this.zoomWidth);
                } else {
                    xMin = this.getValueFromX(this.zoomStartX + this.zoomWidth);
                    xMax = this.getValueFromX(this.zoomStartX);
                }
            }

            if (zoomable) {
                this.removeTooltip();
                this.dataOver = null;
                this.draw(xMin, xMax);
            }

            this.selectionCtx.clearRect(0, 0, this.chartInfo.width, this.chartInfo.height);
            this.mousedown = false;
            this.zoomWidth = 0;
            this.zoomStartX = 0;
        }
    }
    /**
     * Trigger an attach event
     * @method onAttach
     * @private
     */
    onAttach() {
        this.repaint();
    }
    /**
     * Synchronize the chart with its ChartSource
     * @method synchronize
     * @param {string} action - "beforeLoad", "load", "fail" actions
     */
    synchronize(action) {
        switch (action) {
            case 'beforeLoad':
                this.showSpinner();
                break;
            case 'load':
            case 'fail':
                this.hideSpinner();
        }
    }
    /**
     * Show spinner
     * @method showSpinner
     * @private
     */
    showSpinner() {
        if (this.isAttached) {
            this.spinnerNode.style.display = 'block';
        } else {
            this.activateSpinner = true;
        }
    }
    /**
     * Hide spinner
     * @method hideSpinner
     * @private
     */
    hideSpinner() {
        this.activateSpinner = false;

        if (this.spinnerNode.style.display !== 'none') {
            this.spinnerNode.style.display = 'none';
        }
    }
    /**
     * Repaint the Scatter Chart
     * @method repaint
     */
    repaint() {
        if (this.isAttached) {
            this.spinnerNode.style.height = this.chartInfo.height + 'px';
            this.spinnerNode.style.zIndex = this.getzIndex() + 1;
        }
    }
    /**
     * Get value from x
     * @method getValueFromX
     * @private
     * @param {number} x
     * @return {*}
     */
    getValueFromX(x) {
        var offset = 0;
        var value = this.ranges.xAxis[0].min.value;
        var n, l, range, rangeSize;

        for (n = 0, l = this.ranges.xAxis.length; n < l; n++) {
            range = this.ranges.xAxis[n];
            rangeSize = this.chartInfo.xAxis.range[n];

            if (x >= offset && x <= (offset + rangeSize.length)) {
                return value + ((x - offset) / rangeSize.scale);
            }

            value += range.size;
            offset += rangeSize.length;
        }

        return this.ranges.xAxis[this.ranges.xAxis.length - 1].max.value;
    }
    /**
     * Return y from value
     * @param {type} chartInfo
     * @param {type} value
     * @return {number}
     */
    scaleY(value) {
        var offset = 0;
        var n, l, range, rangeSize;

        if (!(this.ranges.yAxis instanceof Array)) {
            if (this.ranges.yAxis.value !== null) {
                return Math.round(this.chartInfo.yAxis.height / 2);
            }

            return;
        }

        for (n = 0, l = this.ranges.yAxis.length; n < l; n++) {
            range = this.ranges.yAxis[n];
            rangeSize = this.chartInfo.yAxis.range[n];

            if (value >= range.min.value && value <= range.max.value) {
                return Math.round(offset + ((value - range.min.value) * rangeSize.scale));
            }

            offset += rangeSize.length;
        }
    }
    /**
     * Calculate all element sizes
     * @method calculateSizes
     * @private
     */
    calculateSizes() {
        var self = this;
        var titleTotalHeight = 0;
        var xAxisTitleTotalHeight = 0;
        var yAxisTitleTotalHeight = 0;
        var leftXAxisExceeding = 0;
        var rightXAxisExceeding = 0;
        var n, l, range, length, totalWeight, stepWidth;

        function setTitleSize(target) {
            var size = self.getParagraphSize(target.font, target.text);

            target.width = size.width;
            target.height = size.height;
        }

        function setLabelMaxSize(target, range) {
            var maxWidth = 0;
            var maxHeight = 0;
            var n = 0;
            var breakNext = false;
            var l, label, size;

            if (!(range instanceof Array)) {
                size = self.getParagraphSize(target.font, range.label);
                target.width = size.width;
                target.height = size.height;
                return;
            }

            l = range.length;
            label = range[0].min.label;

            while (n < l) {
                if (label.length > 0) {
                    size = self.getParagraphSize(target.font, label);

                    if (size.width > maxWidth) {
                        maxWidth = size.width;
                    }

                    if (size.height > maxHeight) {
                        maxHeight = size.height;
                    }
                }

                if (breakNext)  break;

                if (n === l - 1) {
                    label = range[n].max.label;
                    breakNext = true;
                } else {
                    n++;
                    label = range[n].min.label;
                }
            }

            target.width = maxWidth;
            target.height = maxHeight;
        }

        if (this.chartInfo.title.text !== null) {
            setTitleSize(this.chartInfo.title);
            titleTotalHeight = this.chartInfo.title.height + this.chartInfo.title.marginTop + this.chartInfo.title.marginBottom;
        } else {
            this.chartInfo.title.height = 0;
            this.chartInfo.title.width = 0;
        }

        if (this.chartInfo.xAxis.title.text !== null) {
            setTitleSize(this.chartInfo.xAxis.title);
            xAxisTitleTotalHeight = this.chartInfo.xAxis.title.height + this.chartInfo.xAxis.title.marginTop + this.chartInfo.xAxis.title.marginBottom;
        } else {
            this.chartInfo.xAxis.height = 0;
            this.chartInfo.xAxis.width = 0;
        }

        if (this.chartInfo.yAxis.title.text !== null) {
            setTitleSize(this.chartInfo.yAxis.title);
            yAxisTitleTotalHeight = this.chartInfo.yAxis.title.height + this.chartInfo.yAxis.title.marginTop + this.chartInfo.yAxis.title.marginBottom;
        } else {
            this.chartInfo.yAxis.height = 0;
            this.chartInfo.yAxis.width = 0;
        }

        setLabelMaxSize(this.chartInfo.xAxis.labels, this.ranges.xAxis);
        setLabelMaxSize(this.chartInfo.yAxis.labels, this.ranges.yAxis);

        this.chartInfo.yAxis.height = this.chartInfo.height - this.chartInfo.marginTop - titleTotalHeight - this.chartInfo.yAxis.labels.height - this.chartInfo.xAxis.labels.marginTop - this.chartInfo.xAxis.labels.height - xAxisTitleTotalHeight - this.chartInfo.marginBottom - 5;
        this.chartInfo.yAxis.width = this.chartInfo.yAxis.labels.width + yAxisTitleTotalHeight + this.chartInfo.yAxis.labels.marginRight;
        this.chartInfo.yAxis.bottom = this.chartInfo.marginTop + titleTotalHeight + (this.chartInfo.yAxis.labels.height / 2) + this.chartInfo.yAxis.height;
        this.chartInfo.yAxis.right = this.chartInfo.marginLeft + this.chartInfo.yAxis.width;

        this.chartInfo.xAxis.left = this.chartInfo.yAxis.right;
        leftXAxisExceeding = rightXAxisExceeding = this.chartInfo.xAxis.labels.width / 2;
        leftXAxisExceeding = leftXAxisExceeding > this.chartInfo.yAxis.width ? leftXAxisExceeding - this.chartInfo.yAxis.width : 0;
        this.chartInfo.xAxis.width = this.chartInfo.width - this.chartInfo.marginLeft - this.chartInfo.yAxis.width - leftXAxisExceeding - rightXAxisExceeding - this.chartInfo.marginRight;
        this.chartInfo.xAxis.top = this.chartInfo.yAxis.bottom;

        if (this.ranges.xAxis instanceof Array) {
            totalWeight = 0;

            for (n = 0, l = this.ranges.xAxis.length; n < l; n++) {
                totalWeight += this.ranges.xAxis[n].weight;
            }

            stepWidth = this.chartInfo.xAxis.width / totalWeight;
            this.chartInfo.xAxis.range = [];

            for (n = 0, l = this.ranges.xAxis.length; n < l; n++) {
                range = this.ranges.xAxis[n];
                length = stepWidth * range.weight;
                this.chartInfo.xAxis.range.push({ length: length, scale: length / range.size });
            }
        }

        if (this.ranges.yAxis instanceof Array) {
            totalWeight = 0;

            for (n = 0, l = this.ranges.yAxis.length; n < l; n++) {
                totalWeight += this.ranges.yAxis[n].weight;
            }

            stepWidth = this.chartInfo.yAxis.height / totalWeight;
            this.chartInfo.yAxis.range = [];

            for (n = 0, l = this.ranges.yAxis.length; n < l; n++) {
                range = this.ranges.yAxis[n];
                length = stepWidth * range.weight;
                this.chartInfo.yAxis.range.push({ length: length, scale: length / range.size });
            }
        }
    }
    /**
     * Get ranges from x min to x max
     * @param {number} xMin
     * @param {number} xMax
     * @return {Object}
     */
    getRanges(xMin, xMax) {
        if (!(this.chartSource instanceof ChartSource)) return null;

        var xMinMaxAltered = false;
        var xMinMax = { min: null, max: null };
        var yMinMax = { min: null, max: null };
        var n, l, i, j, y;
        var checkYMinMax, minNumber, maxNumber;
        var data, serie, firstPos, lastPos;

        if (fw.isValidNumber(xMin)) {
            xMinMaxAltered = true;
            xMinMax.min = xMin;
        }

        if (fw.isValidNumber(xMax)) {
            xMinMaxAltered = true;
            xMinMax.max = xMax;
        }

        if (xMinMaxAltered) {
            if (xMinMax.min > xMinMax.max) {
                xMinMax = { min: null, max: null };
                xMinMaxAltered = false;
            } else if (this.chartSource.xTimestamp) {
                if (xMinMax.max - xMinMax.min < 1) {
                    xMinMax.min = xMinMax.max;
                }
            } else {
                minNumber = new FwNumber(xMin);
                maxNumber = new FwNumber(xMax);
                if (minNumber.getExponent() === maxNumber.getExponent() && maxNumber.getMantissa() - minNumber.getMantissa() < 1e-6) return null;
            }
        }

        if (this.chartSource.limits.length > 0) {
            for (n = 0, l = this.chartSource.limits.length; n < l; n++) {
                yMinMax.min = this.chartSource.limits[n].value;
                yMinMax.max = this.chartSource.limits[n].value;
            }
        }

        for (n = 0, l = this.chartSource.series.length; n < l; n++) {
            serie = this.chartSource.series[n];
            firstPos = null;
            lastPos = null;

            if (xMinMaxAltered) {
                for (i = 0, j = serie.list.length; i < j; i++) {
                    checkYMinMax = true;
                    data = serie.list[i];

                    if (data.x < xMinMax.min) {
                        checkYMinMax = false;
                        firstPos = i;
                    } else if (data.x > xMinMax.max) {
                        lastPos = i;
                        break;
                    }

                    if (checkYMinMax) {
                        if (yMinMax.min === null || data.y < yMinMax.min) {
                            yMinMax.min = data.y;
                        }

                        if (yMinMax.max === null || data.y > yMinMax.max) {
                            yMinMax.max = data.y;
                        }
                    }
                }

                if (firstPos !== null) {
                    if (firstPos < j - 1) {
                        y = (((serie.list[firstPos + 1].y - serie.list[firstPos].y) * (xMinMax.min - serie.list[firstPos].x)) / (serie.list[firstPos + 1].x - serie.list[firstPos].x)) + serie.list[firstPos].y;

                        if (yMinMax.min === null || y < yMinMax.min) {
                            yMinMax.min = y;
                        }

                        if (yMinMax.max === null || y > yMinMax.max) {
                            yMinMax.max = y;
                        }
                    }
                }

                if (lastPos !== null && lastPos > 0) {
                    y = (((serie.list[lastPos].y - serie.list[lastPos - 1].y) * (xMinMax.max - serie.list[lastPos - 1].x)) / (serie.list[lastPos].x - serie.list[lastPos - 1].x)) + serie.list[lastPos - 1].y;

                    if (yMinMax.min === null || y < yMinMax.min) {
                        yMinMax.min = y;
                    }

                    if (yMinMax.max === null || y > yMinMax.max) {
                        yMinMax.max = y;
                    }
                }
            } else {
                if (serie.xMin !== null && (xMinMax.min === null || serie.xMin < xMinMax.min)) {
                    xMinMax.min = serie.xMin;
                }

                if (serie.xMax !== null && (xMinMax.max === null || serie.xMax > xMinMax.max)) {
                    xMinMax.max = serie.xMax;
                }

                if (serie.yMin !== null && (yMinMax.min === null || serie.yMin < yMinMax.min)) {
                    yMinMax.min = serie.yMin;
                }

                if (serie.yMax !== null && (yMinMax.max === null || serie.yMax > yMinMax.max)) {
                    yMinMax.max = serie.yMax;
                }
            }
        }

        if (this.chartInfo.yAxis.onlyInteger) {
            yMinMax.min = Math.floor(yMinMax.min);
            yMinMax.max = Math.ceil(yMinMax.max);
        }

        if (serie.xTimestamp) {
            return {
                xAxis: getTimeRange(Math.round(xMinMax.min), Math.round(xMinMax.max), this.chartInfo.xAxis.density),
                yAxis: getLinearRange(yMinMax.min, yMinMax.max, this.chartInfo.yAxis.density, true, this.chartInfo.yAxis.onlyInteger)
            };
        } else {
            return {
                xAxis: getLinearRange(xMinMax.min, xMinMax.max, this.chartInfo.xAxis.density),
                yAxis: getLinearRange(yMinMax.min, yMinMax.max, this.chartInfo.yAxis.density, true, this.chartInfo.yAxis.onlyInteger)
            };
        }

        return null;
    }
    /**
     * Fetch data tooltip from x and y position
     * @method fetchTooltip
     * @private
     * @param {number} x
     * @param {number} y
     * @param {number} radius
     * @return {Object}
     */
    fetchTooltip(x, y, radius) {
        var self = this;
        var orientation = -1;
        var n, step, data;

        function getData(x, y) {
            if (self.tooltipData[x] !== undefined) return self.tooltipData[x][y];
        }

        x = Math.round(x);
        y = Math.round(y);
        data = getData(x, y);

        if (data !== undefined) return data;

        for (step = 0; step <= radius; step++) {
            for (n = 0; n <= step; n++) {
                y = y + orientation;
                data = getData(x, y);
                if (data !== undefined) return data;
            }

            for (n = 0; n <= step; n++) {
                x = x + orientation;
                data = getData(x, y);
                if (data !== undefined) return data;
            }

            orientation = -orientation;
        }
    }
    /**
     * Create a tooltip with specified data
     * @param {type} data
     */
    createTooltip(data) {
        var n = 0;
        var x, y;
        var key, textSize, height, width;
        var text, label, arrow, arrowClass;
        var pathColor, pointColor;

        this.removeTooltip();

        if (fw.isFunction(this.series[data.serieName].tooltipTemplate)) {
            text = this.series[data.serieName].tooltipTemplate.call(this, data);
        } else {
            return null;
        }

        textSize = this.getParagraphSize(this.tooltip.font, text);
        height = this.tooltip.marginTop + this.tooltip.marginBottom + textSize.height;
        width = this.tooltip.marginLeft + this.tooltip.marginRight + textSize.width;
        x = this.chartInfo.xAxis.left + data._xAxis + 17;
        y = this.chartInfo.yAxis.bottom - data._yAxis - (height / 2);

        if (x + width + 17 > this.chartInfo.width) {
            x = this.chartInfo.xAxis.left + data._xAxis - width - 17;
            arrowClass = 'left';
        } else {
            arrowClass = 'right';
        }

        for (key in this.compressedData) {
            if (key === data.serieName) {
                pathColor = this.pathColors[n % this.pathColors.length];
                pointColor = this.pointColors[n % this.pointColors.length];
                break;
            }
            n++;
        }

        label = document.createElement('div');
        label.classList.add('fw-scatterchart-label');
        label.style.fontFamily = this.tooltip.font.name;
        label.style.fontSize = this.tooltip.font.size + 'px';
        label.style.fontWeight = this.tooltip.font.weight || 'normal';
        label.style.lineHeight = (this.tooltip.font.name.size + this.tooltip.font.interlineSpacing) + 'px';
        label.innerHTML = text.join('<br/>');

        this.tooltipCtx.fillStyle = pointColor;
        this.tooltipCtx.strokeStyle = '#EEE';
        this.tooltipCtx.lineWidth = 1;
        this.tooltipCtx.beginPath();
        this.tooltipCtx.arc(data._xAxis + this.chartInfo.xAxis.left, this.chartInfo.yAxis.bottom - data._yAxis, 5, 0, 2 * Math.PI, false);
        this.tooltipCtx.fill();
        this.tooltipCtx.stroke();

        this.tooltipNode = document.createElement('div');
        this.tooltipNode.classList.add('fw-scatterchart-tooltip');
        this.tooltipNode.style.paddingTop = this.tooltip.marginTop + 'px';
        this.tooltipNode.style.paddingBottom = this.tooltip.marginBottom + 'px';
        this.tooltipNode.style.paddingLeft = this.tooltip.marginLeft + 'px';
        this.tooltipNode.style.paddingRight = this.tooltip.marginRight + 'px';
        this.tooltipNode.style.borderColor = pathColor;
        this.tooltipNode.style.top = y + 'px';
        this.tooltipNode.style.left = x + 'px';
        this.tooltipNode.appendChild(label);

        arrow = document.createElement('div');
        arrow.classList.add('fw-scatterchart-arrow');
        arrow.classList.add(arrowClass);
        arrow.style.borderColor = pathColor;

        this.tooltipNode.appendChild(arrow);
        this.contentNode.appendChild(this.tooltipNode);
    }
    /**
     * Remove tooltip from the chart
     * @method removeTooltip
     */
    removeTooltip() {
        this.tooltipCtx.clearRect(0, 0, this.chartInfo.width, this.chartInfo.height);

        if (this.tooltipNode !== null) {
            this.tooltipNode.parentNode.removeChild(this.tooltipNode);
            this.tooltipNode = null;
        }
    }
    /**
     * Draw chart from xMin to XMax
     * @param {number} xMin
     * @param {number} xMax
     */
    draw(xMin, xMax) {
        if (!(this.chartSource instanceof ChartSource)) return;

        var self = this;
        var ranges = this.getRanges(xMin, xMax);

        if (ranges !== null) {
            this.ranges = ranges;
        } else {
            this.hideSpinner();
            return;
        }

        this.showSpinner();

        window.setTimeout(function () {
            var n, l, i, j, serie, data, compressedData;

            self.calculateSizes();
            self.compressedData = {};
            self.tooltipData = {};

            for (n = 0, l = self.chartSource.series.length; n < l; n++) {
                serie = self.chartSource.series[n];
                compressedData = self.compressData(serie);
                self.compressedData[serie.name] = compressedData;

                for (i = 0, j = compressedData.length; i < j; i++) {
                    data = compressedData[i];
                    if (!data.artifact) {
                        data.serieName = serie.name;
                        if (self.tooltipData[data._xAxis] === undefined) {
                            self.tooltipData[data._xAxis] = {};
                        }
                        self.tooltipData[data._xAxis][data._yAxis] = data;
                    }
                }
            }

            self.clearChart();
            self.drawTitles();
            self.drawYAxis();
            self.drawXAxis();
            self.drawData();
            self.drawLimits();
            self.hideSpinner();

            return true;
        }, 0);
    }
    /**
     * Clear the Scatter Chart
     * @method clearChart
     * @private
     */
    clearChart() {
        this.chartCtx.clearRect(0, 0, this.chartInfo.width, this.chartInfo.height);
    }
    /**
     * Draw main title, x and y axis titles
     * @method drawTitles
     * @private
     */
    drawTitles() {
        if (this.chartInfo.title.text !== null) {
            this.drawText({
                font:   this.chartInfo.title.font,
                align:  'center',
                x:      this.chartInfo.width / 2,
                y:      this.chartInfo.marginTop + this.chartInfo.title.marginTop,
                text:   this.chartInfo.title.text
            });
        }

        if (this.chartInfo.yAxis.title.text !== null) {
            this.drawText({
                font:       this.chartInfo.yAxis.title.font,
                align:      'center',
                x:          this.chartInfo.marginLeft + this.chartInfo.yAxis.title.marginTop,
                y:          this.chartInfo.yAxis.bottom - (this.chartInfo.yAxis.height / 2),
                text:       this.chartInfo.yAxis.title.text,
                rotation:   -90
            });
        }

        if (this.chartInfo.xAxis.title.text !== null) {
            this.drawText({
                font:   this.chartInfo.xAxis.title.font,
                align:  'center',
                x:      this.chartInfo.xAxis.left + (this.chartInfo.xAxis.width / 2),
                y:      this.chartInfo.height - this.chartInfo.marginBottom - this.chartInfo.xAxis.title.marginBottom - this.chartInfo.xAxis.title.height,
                text:   this.chartInfo.xAxis.title.text
            });
        }
    }
    /**
     * Draw y axis
     * @method drawYAxis
     * @private
     */
    drawYAxis() {
        var breakNext = false;
        var x = this.chartInfo.yAxis.right;
        var y = this.chartInfo.yAxis.bottom;
        var n, l, range, rangeSize, lines, value, strokeline;

        if (!(this.ranges.yAxis instanceof Array)) {
            this.chartCtx.save();
            this.chartCtx.strokeStyle = '#C0C0C0';
            this.chartCtx.beginPath();
            this.chartCtx.moveTo(x, y);
            this.chartCtx.lineTo(x + this.chartInfo.xAxis.width, y);
            this.chartCtx.stroke();

            if (this.ranges.yAxis.value !== null) {
                y -= this.chartInfo.yAxis.height / 2;
                this.chartCtx.moveTo(x, y);
                this.chartCtx.lineTo(x + this.chartInfo.xAxis.width, y);
                this.chartCtx.stroke();
                this.drawText({
                    font:   this.chartInfo.yAxis.labels.font,
                    align:  'right',
                    x:      x - this.chartInfo.yAxis.labels.marginRight,
                    y:      y - (this.chartInfo.yAxis.labels.height / 2),
                    text:   this.ranges.yAxis.label
                });
            }

            this.chartCtx.restore();

            return;
        }

        n = 0;
        l = this.ranges.yAxis.length;
        range = this.ranges.yAxis[0];
        rangeSize = this.chartInfo.yAxis.range[0];
        lines = range.min.label;
        value = range.min.value;
        this.chartCtx.save();

        while (n < l) {
            strokeline = true;

            if (this.chartInfo.yAxis.onlyInteger && (value % 1 !== 0)) {
                strokeline = false;
            }

            if (strokeline) {
                this.drawText({
                    font:   this.chartInfo.yAxis.labels.font,
                    align:  'right',
                    x:      x - this.chartInfo.yAxis.labels.marginRight,
                    y:      y - (this.chartInfo.yAxis.labels.height / 2),
                    text:   lines
                });

                this.chartCtx.strokeStyle = '#C0C0C0';
                this.chartCtx.beginPath();
                this.chartCtx.moveTo(x, y);
                this.chartCtx.lineTo(x + this.chartInfo.xAxis.width, y);
                this.chartCtx.stroke();
            }

            if (breakNext) break;
            y -= rangeSize.length;

            if (n === l - 1) {
                lines = range.max.label;
                value = range.max.value;
                breakNext = true;
            } else {
                n++;
                range = this.ranges.yAxis[n];
                rangeSize = this.chartInfo.yAxis.range[n];
                lines = range.min.label;
                value = range.min.value;
            }
        }

        this.chartCtx.restore();
    }
    /**
     * Draw x axis
     * @method drawXAxis
     * @private
     */
    drawXAxis() {
        var breakNext = false;
        var x = this.chartInfo.xAxis.left;
        var y = this.chartInfo.xAxis.top;
        var n, l, range, rangeSize, lines;

        if (!(this.ranges.xAxis instanceof Array)) {
            if (this.ranges.xAxis.value !== null) {
                this.chartCtx.save();
                x += this.chartInfo.xAxis.width / 2;

                this.drawText({
                    font:   this.chartInfo.xAxis.labels.font,
                    align:  'center',
                    x:      x,
                    y:      y + this.chartInfo.xAxis.labels.marginTop,
                    text:   this.ranges.xAxis.label
                });

                this.chartCtx.strokeStyle = '#C0C0C0';
                this.chartCtx.beginPath();
                this.chartCtx.moveTo(x, y);
                this.chartCtx.lineTo(x, y + 5);
                this.chartCtx.stroke();
                this.chartCtx.restore();
            }

            return;
        }

        n = 0;
        l = this.ranges.xAxis.length;
        range = this.ranges.xAxis[0];
        rangeSize = this.chartInfo.xAxis.range[0];
        lines = range.min.label;
        this.chartCtx.save();
        this.chartCtx.strokeStyle = '#C0C0C0';

        while (n < l) {
            this.drawText({
                font:   this.chartInfo.xAxis.labels.font,
                align:  'center',
                x:      x,
                y:      y + this.chartInfo.xAxis.labels.marginTop,
                text:   lines
            });

            this.chartCtx.beginPath();
            this.chartCtx.moveTo(x, y);
            this.chartCtx.lineTo(x, y + 5);
            this.chartCtx.stroke();
            if (breakNext) break;
            x += rangeSize.length;

            if (n === l - 1) {
                lines = range.max.label;
                breakNext = true;
            } else {
                n++;
                range = this.ranges.xAxis[n];
                rangeSize = this.chartInfo.xAxis.range[n];
                lines = range.min.label;
            }
        }

        this.chartCtx.restore();
    }
    /**
     * Draw limits
     * @method drawLimits
     * @private
     */
    drawLimits() {
        if (!(this.chartSource instanceof ChartSource)) return;

        var num = 0;
        var n, l, y, data, options;

        this.chartCtx.save();

        for (n = 0, l = this.chartSource.limits.length; n < l; n++) {
            data = this.chartSource.limits[n];
            options = data || {};

            if (fw.isValidNumber(data.value)) {
                y = this.scaleY(data.value);

                if (y >= 0 && y <= this.chartInfo.yAxis.height) {
                    y = this.chartInfo.yAxis.bottom - y;
                    this.chartCtx.beginPath();
                    this.chartCtx.strokeStyle = options.color || this.limitColors[num % this.limitColors.length];
                    this.chartCtx.lineWidth = 2;
                    this.chartCtx.moveTo(this.chartInfo.xAxis.left, y);
                    this.chartCtx.lineTo(this.chartInfo.xAxis.left + this.chartInfo.xAxis.width, y);
                    this.chartCtx.stroke();
                }
            }
            num++;
        }

        this.chartCtx.restore();
    }
    /**
     * Draw data
     * @method drawData
     * @private
     */
    drawData() {
        var num = 0;
        var n, l, xAxis, yAxis;
        var key, list, data, options, type;

        this.chartCtx.save();

        for (key in this.compressedData) {
            list = this.compressedData[key];
            options = this.chartInfo.series[key] || {};
            type = options.type || 'line';

            if (list.length > 1 && type === 'line') {
                this.chartCtx.globalAlpha = 0.9;
                this.chartCtx.strokeStyle = options.pathColor || this.pathColors[num % this.pathColors.length];
                this.chartCtx.lineWidth = 2;

                for (n = 0, l = (list.length - 1); n < l; n++) {
                    this.chartCtx.beginPath();
                    data = list[n];
                    this.chartCtx.moveTo(data._xAxis + this.chartInfo.xAxis.left, this.chartInfo.yAxis.bottom - data._yAxis);
                    data = list[n + 1];
                    this.chartCtx.lineTo(data._xAxis + this.chartInfo.xAxis.left, this.chartInfo.yAxis.bottom - data._yAxis);
                    this.chartCtx.stroke();
                }
            }
            num++;
        }

        num = 0;

        for (key in this.compressedData) {
            list = this.compressedData[key];
            options = this.chartInfo.series[key] || {};
            type = options.type || 'line';

            if (list.length > 0 && type === 'scatter' || fw.isFunction(options.tooltipTemplate)) {
                this.chartCtx.fillStyle = options.pointColor || this.pointColors[num % this.pointColors.length];
                this.chartCtx.strokeStyle = '#EEE';
                this.chartCtx.globalAlpha = 0.9;
                this.chartCtx.lineWidth = 1;

                for (n = 0, l = list.length; n < l; n++) {
                    data = list[n];

                    if (!data.artifact) {
                        data = list[n];
                        xAxis = data._xAxis;
                        yAxis = data._yAxis;

                        if (xAxis === undefined) {
                            xAxis = this.chartInfo.xAxis.width / 2;
                        }

                        if (yAxis === undefined) {
                            yAxis = this.chartInfo.yAxis.height / 2;
                        }

                        this.chartCtx.beginPath();
                        this.chartCtx.arc(xAxis + this.chartInfo.xAxis.left, this.chartInfo.yAxis.bottom - yAxis, 4, 0, 2 * Math.PI, false);
                        this.chartCtx.fill();
                        this.chartCtx.stroke();
                    }
                }
            }
            num++;
        }

        this.chartCtx.restore();
    }
    /**
     * Compress data from specified serie
     * @method compressData
     * @private
     * @param {Object} compressedData
     */
    compressData(serie) {
        var self = this;
        var compressedData = [];
        var data = serie.list || [];
        var xMinLimit = null;
        var xMaxLimit = null;
        var xInfLimit = 0;
        var xSupLimit = 0;
        var i = 0;
        var length = data.length;
        var min, max, xMin, xMax;
        var n, l, d, obj, x, y;
        var currentRange, currentRangeSize, stepIndex;
        var dataStart, dataEnd, dataMin, dataMax, startPos, minPos, maxPos, endPos;

        function goNextStep() {
            stepIndex = currentRange === undefined ? 0 : stepIndex + 1;
            currentRange = self.ranges.xAxis[stepIndex];
            currentRangeSize = self.chartInfo.xAxis.range[stepIndex];
            xInfLimit = xSupLimit;
            xSupLimit += currentRangeSize.length;
        }

        if (!(this.ranges.xAxis instanceof Array)) {
            if (this.ranges.xAxis.value !== null) {
                l = data.length;

                for (n = 0; n < l; n++) {
                    if (data[n].x === this.ranges.xAxis.value) {
                        obj = fw.copyObject(data[n]);
                        obj._xAxis = this.chartInfo.xAxis.width / 2;
                        obj._yAxis = this.scaleY(obj.y);
                        compressedData.push(obj);
                        break;
                    }
                }
            }

            return compressedData;
        }

        min = this.ranges.xAxis[0].min.value;
        max = this.ranges.xAxis[this.ranges.xAxis.length - 1].max.value;
        goNextStep();

        for (n = 0; n < this.chartInfo.xAxis.width; n++) {
            if (n > xSupLimit) goNextStep();

            xMin = currentRange.min.value + ((n - xInfLimit) / currentRangeSize.scale);
            xMax = currentRange.min.value + (((n + 1) - xInfLimit) / currentRangeSize.scale);
            dataStart = null;
            dataEnd = null;
            dataMin = null;
            dataMax = null;
            startPos = null;
            endPos = null;
            minPos = null;
            maxPos = null;

            while (i < length) {
                d = data[i];

                if (d.x !== undefined) {
                    x = d.x;

                    if (x <= min) {
                        xMinLimit = d;
                    } else if (x >= max) {
                        xMaxLimit = d;
                    }

                    if (x > xMax) { break; }

                    if (x >= xMin) {
                        if (dataStart === null) {
                            dataStart = d;
                            startPos = i;
                        }

                        if (dataMin === null) {
                            dataMin = d;
                            minPos = i;
                        } else if (d.y < dataMin.y) {
                            dataMin = d;
                            minPos = i;
                        }

                        if (dataMax === null) {
                            dataMax = d;
                            maxPos = i;
                        } else if (d.y > dataMax.y) {
                            dataMax = d;
                            maxPos = i;
                        }
                    }
                }
                i++;
            }

            if (startPos !== null) {
                endPos = i - 1;
                dataEnd = data[endPos];
                obj = fw.copyObject(dataStart);
                obj._xAxis = n;
                obj._yAxis = this.scaleY(obj.y);
                compressedData.push(obj);

                if (startPos !== endPos) {
                    if (minPos === maxPos) {
                        if (minPos > startPos && minPos < endPos) {
                            obj = fw.copyObject(dataMin);
                            obj._xAxis = n;
                            obj._yAxis = this.scaleY(obj.y);
                            compressedData.push(obj);
                        }
                    } else if (minPos < maxPos) {
                        if (minPos > startPos) {
                            obj = fw.copyObject(dataMin);
                            obj._xAxis = n;
                            obj._yAxis = this.scaleY(obj.y);
                            compressedData.push(obj);
                        }

                        if (maxPos < endPos) {
                            obj = fw.copyObject(dataMax);
                            obj._xAxis = n;
                            obj._yAxis = this.scaleY(obj.y);
                            compressedData.push(obj);
                        }
                    } else {
                        if (maxPos > startPos) {
                            obj = fw.copyObject(dataMax);
                            obj._xAxis = n;
                            obj._yAxis = this.scaleY(obj.y);
                            compressedData.push(obj);
                        }

                        if (minPos < endPos) {
                            obj = fw.copyObject(dataMin);
                            obj._xAxis = n;
                            obj._yAxis = this.scaleY(obj.y);
                            compressedData.push(obj);
                        }
                    }

                    if (fw.isNotNull(dataEnd)) {
                        obj = fw.copyObject(dataEnd);
                        obj._xAxis = n;
                        obj._yAxis = this.scaleY(obj.y);
                        compressedData.push(obj);
                    }
                }
            }
        }

        if (compressedData.length > 0) {
            if (xMinLimit !== null) {
                obj = compressedData[0];

                if (xMinLimit.x !== obj.x || xMinLimit.y !== obj.y) {
                    y = (((obj.y - xMinLimit.y) * (min - xMinLimit.x)) / (obj.x - xMinLimit.x)) + xMinLimit.y;
                    compressedData.unshift({
                        x:          min,
                        y:          y,
                        _xAxis:     0,
                        _yAxis:     this.scaleY(y),
                        artifact:   true
                    });
                }
            }

            if (xMaxLimit !== null) {
                obj = compressedData[compressedData.length - 1];

                if (xMaxLimit.x !== obj.x || xMaxLimit.y !== obj.y) {
                    y = (((obj.y - xMaxLimit.y) * (max - xMaxLimit.x)) / (obj.x - xMaxLimit.x)) + xMaxLimit.y;
                    compressedData.push({
                        x:          max,
                        y:          y,
                        _xAxis:     this.chartInfo.xAxis.width - 1,
                        _yAxis:     this.scaleY(y),
                        artifact:   true
                    });
                }
            }
        } else {
            if (xMinLimit !== null && xMaxLimit !== null) {
                y = (((xMaxLimit.y - xMinLimit.y) * (min - xMinLimit.x)) / (xMaxLimit.x - xMinLimit.x)) + xMinLimit.y;
                compressedData.push({
                    x:          min,
                    y:          y,
                    _xAxis:     0,
                    _yAxis:     this.scaleY(y),
                    artifact:   true
                });
                y = (((xMinLimit.y - xMaxLimit.y) * (max - xMaxLimit.x)) / (xMinLimit.x - xMaxLimit.x)) + xMaxLimit.y;
                compressedData.push({
                    x:          max,
                    y:          y,
                    _xAxis:     this.chartInfo.xAxis.width - 1,
                    _yAxis:     this.scaleY(y),
                    artifact:   true
                });
            }
        }

        return compressedData;
    }
    /**
     * Get paragraph size
     * @method getParagraphSize
     * @private
     * @param {Object} font
     * @param {string|Array} text
     * @return {Object}
     */
    getParagraphSize(font, text) {
        var width = 0;
        var height = 0;
        var lines = [];
        var w, n, l;

        lines = text instanceof Array ? text : lines.push(text);
        l = lines.length;

        if (l > 0) {
            height = (font.size * l) + ((l - 1) * (font.interlineSpacing || 0));
            this.calculateSizeTextNode.style.fontFamily = font.name;
            this.calculateSizeTextNode.style.fontSize = (font.size || 10) + 'px';
            this.calculateSizeTextNode.style.fontWeight = font.weight || 'normal';

            for (n = 0; n < l; n++) {
                this.calculateSizeTextNode.innerHTML = lines[n];
                w = this.calculateSizeTextNode.offsetWidth;

                if (w > width) {
                    width = w;
                }
            }
        }

        return { width: width, height: height };
    }
    /**
     * Draw text
     * @method drawText
     * @private
     * @param {Object} config
     */
    drawText(options) {
        var fontSize = options.font.size || 10;
        var fontInterlineSpacing = options.font.interlineSpacing || 0;
        var lines = options.text instanceof Array ? options.text : [options.text];
        var posX, posY, n, l;

        if (lines.length === 0) return;
        posX = options.x || 0;
        posY = options.y || 0;
        this.chartCtx.save();
        this.chartCtx.font = (options.font.weight || 'normal') + ' ' + String(fontSize) + 'px ' + options.font.name;
        this.chartCtx.textAlign = options.align || 'start';

        switch (options.rotation || 0) {
            case -90:
                this.chartCtx.rotate(-90 * Math.PI / 180);
                for (n = 0, l = lines.length; n < l; n++) {
                    posX += fontSize;
                    this.chartCtx.fillText(this.createMessage(lines[n]), -posY, posX);
                    posX += fontInterlineSpacing;
                }
                break;
            default:
                for (n = 0, l = lines.length; n < l; n++) {
                    posY += fontSize;
                    this.chartCtx.fillText(this.createMessage(lines[n]), posX, posY);
                    posY += fontInterlineSpacing;
                }
                break;
        }

        this.chartCtx.restore();
    }
}

module.exports = FwScatterChart;
