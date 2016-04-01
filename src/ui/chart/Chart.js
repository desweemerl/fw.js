/**
 * @module fw/ui/chart/Chart
 * @license GNU Affero General Public License version 3
 * @author Ludovic Desweemer
 */

'use strict';

var ChartSource = require('../../source/ChartSource');
var ElementError = require('../../error/ElementError');
var fw = require('../../Core');
var FwElement = require('../Element');

/**
 * Chart allows binding fw/source/ChartSource
 * @class
 * @alias module:/fw/ui/chart/Chart
 * @augments fw/ui/Element
 * @param {Object} config - the configuration object parameter
 * @param {fw/source/DataSource} [config.dataSource] - dataSource to bind
 * @param {string} [config.property] - element property
 */
class Chart extends FwElement {
    /**
     * @constructor
     */
    constructor(config) {
        super(config);
        // Define chartSource
        this.setChartSource(this.config.chartSource || this.chartSource);
    }
    /**
     * Synchronize the element with its ArraySource
     * @method synchronize
     * @abstract
     */
    synchronize(action) {
        throw new ElementError({
            elementName: 'ElementArray',
            message:     'synchronize method must be implemented',
            origin:      'synchronize method'
        });
    }
    /**
     * Set the ChartSource of the chart
     * @method setChartSource
     * @param {fw/source/ChartSource} chartSource - chartSource linked to the scatter chart
     */
    setChartSource(chartSource) {
        if (this.chartSource !== chartSource) {
            if (this.chartSource instanceof ChartSource) {
                this.chartSource.unbind(this);
            }

            if (chartSource instanceof ChartSource) {
                chartSource.bind(this);
            } else {
                this.chartSource = null;
            }
        }
    }
    /**
     * Get the ChartSource of the chart
     * @method getChartSource
     * @return {fw/source/ChartSource}
     */
    getChartSource() {
        return this.chartSource;
    }
}

module.exports = Chart;
