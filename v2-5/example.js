/*
  This is me imagining the script as an object that we import
*/
// Load Fito Pricipe's landsat masking tools
var cloud_masks = require('users/fitoprincipe/geetools:cloud_masks');
var maskLandsat = cloud_masks.landsatSR()

// var Wacanda = require('users/svangordon/path/to:file')

var Wacanda = function() {
  return {
    imageCollection: 'imageCollection',
    timePeriod: 'timePeriod',
    labelImage: ee.Image('users/svangordon/conference/atlas/swa_2013lulc_2km'),
    get labelProjection() {
      return this.labelImage.projection();
    }
  }
}

var wacanda = new Wacanda()

print(wacanda.labelProjection)

/*
var wacanda = Wacanda()
  .setImageCollection('landsat8-sr')
  .addTimePeriod('09-15', '11-15')
  .setLabels('atlas', 2013)
  .setGeometry(geometry)
*/
